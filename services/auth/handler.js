const hash = require("js-sha256");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");

const { readJsonBody, sendJson, parseCookies } = require("./helpers/parser");
const { extractToken } = require("./helpers/token");

const { getDb } = require("./mongo");
const { createUserProfile, markUserConnected, markUserDisconnected } = require("./userClient");

const {
    JWT_SECRET,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,

    USER_SERVICE_URL,
} = process.env;


function createAccessToken(user) {
    return jwt.sign(
        { sub: user._id.toString(), username: user.username, type: 'access' },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

function createRefreshToken(user) {
    return jwt.sign(
        { sub: user._id.toString(), username: user.username, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}


// TODO : Use session for mobile user instead of long JWT token

function createMobileSessionId(user) {
    const session = jwt.sign(
        { sub: user._id.toString(), username: user.username, type: 'session' },
        JWT_SECRET,
    );

    return session;
}



exports.HTTPHandler = {
    generateGuestToken: async (req, res) => {
        const guest = {_id: randomUUID(), username: "guest"}
        const guestToken = createAccessToken(guest);

        return sendJson(res, 200, { ok: true, guestToken });
    },

    signup: async (req, res) => {
        const { username, password, question, answer } = await readJsonBody(req);

        if (!username || !password || !question || !answer) {
            sendJson(res, 400, {ok: false, error: "MISSING_FIELDS"});
            return;
        }
        if(username.length<2){
            sendJson(res,403,{ok: false, error: "USERNAME_TOO_SHORT"});
            return;
        }
        if(password.length<8){
            sendJson(res,403,{ok: false, error: "PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS"});
            return;
        }

        const db = await getDb();
        const users = db.collection("users");
        const questions = db.collection("questions");


        const existing = await users.findOne({ username });
        if (existing) {
            sendJson(res, 409, { ok: false, error: "ALREADY_EXISTS" });
            return;
        }

        let result;
        try {
            result = await users.insertOne({
                username,
                password: hash(password),
            });
            await questions.insertOne({
                userId: result.insertedId,
                question: question,
                answer: answer
            });
        } catch (err) {
            console.error("Internal error while inserting user in auth DB:", err);
            sendJson(res, 500, {
                ok: false,
                error: err.message,
            });
            return;
        }

        try {
            await createUserProfile({
                authId: result.insertedId.toString(),
                username,
            });
        } catch (err) {
            // Rollback Auth DB
            await users.deleteOne({ _id: result.insertedId });
            await questions.deleteOne({ userId: result.insertedId });

            console.error("Internal error while creating user account:", err);
            sendJson(res, 500, {ok: false, error: err.message});
            return;
        }

        sendJson(res, 201, {
            ok: true,
            id: result.insertedId,
            detail : "Compte créé avec succès"
        });
    },

    login: async (req, res) => {
        const origin = req.headers.origin;

        const { username, password } = await readJsonBody(req);
        if (!username || !password) {
            return sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
        }

        const db = await getDb();
        const users = db.collection("users");
        const sessions = db.collection("sessions");

        const user = await users.findOne({ username });;
        if (!user) {
            sendJson(res, 409, {ok: false, error: "USERNAME_NOT_FOUND"});
            return;
        }

        const hashedPassword = hash(password);
        if(hashedPassword!==user.password) {
            return sendJson(res, 409, {ok:false, error: "INVALID_PASSWORD" });
        }

        const accessToken = createAccessToken(user);

        try {
            await markUserConnected(accessToken);
        } catch (err) {
            console.error("Internal error while marking the user as connected:", err);
            sendJson(res, 500, { ok: false, error: err.message });
            return;
        }

        let refreshToken;

        if (origin === "https://khet-olympe.mobile.app") {
            refreshToken = createMobileSessionId(user);
            await sessions.insertOne({refreshToken, username});
        } else {
            refreshToken = createRefreshToken(user);
        }

        sendJson(res, 200, {
            ok: true,
            accessToken,
            refreshToken,
            detail : "Vous êtes connecté ! :)"
        });
    },

    checkAccessToken: async (req, res) => {
        const token = extractToken(req, await readJsonBody(req));
        if (!token) {
            sendJson(res, 400, { ok: false, error: 'MISSING_TOKEN' });
            return;
        }

        try {
            const payload = jwt.verify(token, JWT_SECRET);
            if (payload.type === 'refresh' || payload.type === 'session') {
                sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN_TYPE' });
                return;
            }
            sendJson(res, 200, { ok: true, payload });
        } catch (error) {
            sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN' });
            return;
        }
    },

    renewAcessToken: async (req, res) => {
        const token = extractToken(req, await readJsonBody(req));
        if (!token) {
            sendJson(res, 400, { ok: false, error: 'MISSING_TOKEN' });
            return;
        }

        const db = await getDb();
        const sessions = db.collection("sessions");

        let newAccessToken;
        try {
            // Check validity of refresh token or session id
            const payload = jwt.verify(token, JWT_SECRET);
            if (payload.type === "session") {
                const sessionExists = sessions.findOne({sessionId: token});
                if (!sessionExists) {
                    throw new Error(`Session '${payload}' doesn't exist`);
                }
            }

            newAccessToken = createAccessToken({_id: payload.sub, username: payload.username});
        } catch (error) {
            sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN' });
            return;
        }

        sendJson(res, 200, { ok: true, token: newAccessToken, accessToken: newAccessToken });
    },

    resetPassword: async (req, res) => {
        const {username,answer,password} = await readJsonBody(req);
        if (!username || !answer || !password) {
            return sendJson(res, 400, { ok: false, error: 'MISSING_FIELDS' });
        }

        const db = await getDb();
        const users = db.collection("users");
        const questions = db.collection("questions");

        const user = await users.findOne({ username });
        if (!user) {
            return sendJson(401, { ok: false, error: "USERNAME_NOT_FOUND" });
        }

        const userQuestion = await questions.findOne({userId:user._id});
        if (!userQuestion) {
            return sendJson(401, { ok: false, error: "QUESTION_NOT_FOUND" });
        }

        if (userQuestion.answer !== answer) {
            return sendJson(401, { ok: false, error: "INVALID_ANSWER" });
        }

        await users.updateOne({_id: user._id}, {
            $set: { password: hash(password) }
        });

        return sendJson(res, 200, { ok: true, detail : "PASSWORD_RESET" });
    },

    getQuestion: async (req, res) => {
        const { username } = await readJsonBody(req);

        const db = await getDb();
        const users = db.collection("users");
        const questions = db.collection("questions");

        const user = await users.findOne({ username });
        if (!user) {
            return sendJson(401, { ok: false, error: "USERNAME_NOT_FOUND" });
        }

        const question = await questions.findOne({userId:user._id});
        if (!question) {
            return sendJson(res, 401, {ok: false, error: "QUESTION_NOT_FOUND" });
        }

        sendJson(res, 200, { ok: true, question : question.question });
    },

    logout: async (req, res) => {
        const { refreshToken } = parseCookies(req.headers.cookie);
        const accessToken = extractToken(req, null);

        let payload;
        try {
            payload = jwt.verify(refreshToken, JWT_SECRET);
        } catch (err) {
            /* nothing */
        }

        if (payload.type === "session") {
            const db = await getDb();
            const sessions = db.collection("sessions");

            await sessions.deleteOne({ refreshToken });
        }

        try {
            await markUserDisconnected(accessToken);
        } catch (err) {
            console.error("Internal error while marking the user as disconnected:", err);
            sendJson(res, 500, { ok: false, error: err.message });
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': [
                'userToken=; Path=/; Max-Age=0',
                'refreshToken=; Path=/; Max-Age=0',
                'userId=; Path=/; Max-Age=0',
                'gameId=; Path=/; Max-Age=0'
            ],
        });
        res.end(JSON.stringify({ ok: true, detail: 'LOGOUT_SUCCESS' }));
    }
};
