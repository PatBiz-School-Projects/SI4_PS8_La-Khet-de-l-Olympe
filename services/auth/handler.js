const hash = require("js-sha256");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");

const { readJsonBody, sendJson } = require("./helpers/parser");
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


exports.HTTPHandler = {
    generateGuestToken: async (req, res) => {
        const guest = {_id: randomUUID(), username: "guest"}
        const guestToken = createAccessToken(guest);

        return sendJson(res, 200, { ok: true, guestToken });
    },

    login: async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const { username, password } = body;

            if (!username || !password) {
                return sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
            }
            const db = await getDb();
            const users = db.collection("users");
            const user = await users.findOne({ username });
            if (!user) {
                return sendJson(res, 409, { ok: false, error: "USERNAME_NOT_FOUND" });
            }
            const hashedPassword = hash(password);
            if(hashedPassword!==user.password) {
                return sendJson(res, 409, {ok:false, error: "INVALID_PASSWORD" });
            }
            const accessToken = createAccessToken(user);
            const refreshToken = createRefreshToken(user);
            await markUserConnected(accessToken);
            return sendJson(res, 200, {
                ok: true,
                accessToken: accessToken,
                refreshToken: refreshToken,
                detail : "Vous êtes connecté ! :)"
            });
        } catch (error) {
            return sendJson(res, 500, {
                ok: false,
                error: String(error?.message ?? error)
            });
        }
    },

    signup: async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const { username, password,question,answer } = body;

            if (!username || !password || !question || !answer) {
                return sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
            }
            if(username.length<2){
                return sendJson(res,403,{ok:false,error:"USERNAME_TOO_SHORT"});
            }
            if(password.length<8){
                return sendJson(res,403,{ok:false,error:"PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS"});
            }
            const db = await getDb();
            const users = db.collection("users");
            const questions = db.collection("questions");
            const existing = await users.findOne({ username });
            if (existing) {
                return sendJson(res, 409, { ok: false, error: "ALREADY_EXISTS" });
            }
            const hashedPassword = hash(password);

            const result = await users.insertOne({
                username,
                password: hashedPassword,
            });

            try {
                await createUserProfile({
                    authId: result.insertedId.toString(),
                    username,
                });
            } catch (syncError) {
                await questions.deleteOne({ userId: result.insertedId });
                await users.deleteOne({ _id: result.insertedId });
                throw syncError;
            }

            await questions.insertOne({
                userId: result.insertedId,
                question: question,
                answer: answer
            });

            sendJson(res, 201, {
                ok: true,
                id: result.insertedId,
                detail : "Compte créé avec succès"
            });
        } catch (err) {
            console.error("Internal error while creating user account:", err);
            sendJson(res, 500, {
                ok: false,
                error: err.message,
            });
            return;
        }
    },

    checkToken: async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const token = extractToken(req, body);
            if (!token) {
                return sendJson(res, 400, { ok: false, error: 'MISSING_TOKEN' });
            }

            const payload = jwt.verify(token, JWT_SECRET);
            if (payload.type === 'refresh') {
                return sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN_TYPE' });
            }
            return sendJson(res, 200, { ok: true, payload });
        } catch (error) {
            return sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN' });
        }
    },

    renewToken: async (req, res) => {
        try {
            const body = await readJsonBody(req);
            const token = extractToken(req, body);
            if (!token) {
                return sendJson(res, 400, { ok: false, error: 'MISSING_TOKEN' });
            }

            const payload = jwt.verify(token, JWT_SECRET);
            const newAccessToken = jwt.sign(
                { sub: payload.sub, username: payload.username, type: 'access' },
                JWT_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );
            return sendJson(res, 200, { ok: true, token: newAccessToken, accessToken: newAccessToken });
        } catch (error) {
            return sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN' });
        }
    },

    resetPassword: async (req, res) => {
        try{
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
            const dbQuestion = await questions.findOne({userId:user._id});
            const isAnswerOK = dbQuestion.answer === answer;
            if (!isAnswerOK) {
                return sendJson(401, { ok: false, error: "INVALID_ANSWER" });
            }
            const hashedPassword = hash(password);
            await users.updateOne(
                {_id: user._id},
                {
                    $set: {
                        password: hashedPassword,
                    }
                }
            );
            return sendJson(res, 200, { ok: true, detail : "PASSWORD_RESET" });
        }
        catch(error) {
            return sendJson(res,500, {ok: false, error: String(error?.message ?? error)});
        }
    },

    getQuestion: async (req, res) => {
        try{
            const {username} = await readJsonBody(req);
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
            return sendJson(res, 200, { ok: true, question : question.question });
        }
        catch(error) {
            return sendJson(res, 500, {ok: false,error: String(error?.message ?? error)});
        }
    },

    logout: async (req, res) => {
        try {
            const token = extractToken(req,null);
            await markUserDisconnected(token);
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': [
                    'userToken=; Path=/; Max-Age=0',
                    'userId=; Path=/; Max-Age=0',
                    'gameId=; Path=/; Max-Age=0'
                ]
            });
            res.end(JSON.stringify({ ok: true, detail: 'LOGOUT_SUCCESS' }));
        } catch (error) {
            return sendJson(res, 500, {
                ok: false,
                error: String(error?.message ?? error),
            });
        }
    }
};
