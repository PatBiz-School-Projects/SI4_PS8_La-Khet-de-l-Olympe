const { getDb } = require("./mongo");
const hash = require("js-sha256");
const { readJsonBody, sendJson } = require("./helpers/parser");
const jwt = require("jsonwebtoken");
const {createUserProfile, markUserConnected,markUserDisconnected} = require("./userClient")
const {extractToken} = require("./helpers/token")

const jwtSecret = process.env.JWT_SECRET;
const tokenExpiry = process.env.TOKEN_EXPIRY;

async function register(req, res) {
    try {
        const body = await readJsonBody(req);
        const { username, password,question,answer } = body;

        if (!username || !password || !question || !answer) {
            return sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
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
        })

        return sendJson(res, 201, {
            ok: true,
            id: result.insertedId,
            detail : "Compte créé avec succès"
        });
    } catch (error) {
        return sendJson(res, 500, {
            ok: false,
            error: String(error?.message ?? error),
        });
    }
}

async function login(req, res) {
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

        const token = jwt.sign({ sub: user._id.toString(), username: user.username }, jwtSecret, {
            expiresIn: tokenExpiry
        });
        await markUserConnected(token);
        return sendJson(res, 200, { ok: true, token , detail : "Vous êtes connecté ! :)"});
    } catch (error) {
        return sendJson(res, 500, {
            ok: false,
            error: String(error?.message ?? error)
        });
    }
}

async function checkToken(req, res) {
    try {
        const body = await readJsonBody(req);
        const token = extractToken(req, body);
        if (!token) {
            return sendJson(res, 400, { ok: false, error: 'MISSING_TOKEN' });
        }

        const payload = jwt.verify(token, jwtSecret);
        return sendJson(res, 200, { ok: true, payload });
    } catch (error) {
        return sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN' });
    }
}

async function renewToken(req, res) {
    try {
        const body = await readJsonBody(req);
        const token = extractToken(req, body);
        if (!token) {
            return sendJson(res, 400, { ok: false, error: 'MISSING_TOKEN' });
        }

        const payload = jwt.verify(token, jwtSecret);
        const newToken = jwt.sign({ sub: payload.sub, username: payload.username }, jwtSecret, {
            expiresIn: tokenExpiry
        });
        return sendJson(res, 200, { ok: true, token: newToken });
    } catch (error) {
        return sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN' });
    }
}

async function getQuestion(req, res) {
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
}

async function resetPassword(req,res){
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
}
async function logout(req, res) {
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
module.exports = { register, login, checkToken, renewToken, getQuestion,resetPassword,logout };
