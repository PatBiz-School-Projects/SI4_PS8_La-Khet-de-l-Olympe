const { getDb } = require("./mongo");
const hash = require("js-sha256");
const { readJsonBody, sendJson } = require("./helpers/parser");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || 'toztoz';
const tokenExpiry = process.env.TOKEN_EXPIRY || '12h';

async function register(req, res) {
    try {
        const body = await readJsonBody(req);
        const { username, password } = body;

        if (!username || !password) {
            return sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
        }
        const db = await getDb();
        const users = db.collection("users");
        const existing = await users.findOne({ username });
        if (existing) {
            return sendJson(res, 409, { ok: false, error: "ALREADY_EXISTS" });
        }
        const hashedPassword = hash(password);

        const result = await users.insertOne({
            username,
            password: hashedPassword,
        });

        return sendJson(res, 201, {
            ok: true,
            id: result.insertedId,
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
        return sendJson(res, 200, { ok: true, token });
    } catch (error) {
        return sendJson(res, 500, {
            ok: false,
            error: String(error?.message ?? error),
        });
    }
}

function extractToken(req, body) { // fonction qui extrait le token du body
    if (body && body.token) {
        return body.token;
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length);
    }

    return null;
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
        const newToken = jwt.sign({ sub: payload.sub, email: payload.email }, jwtSecret, {
            expiresIn: tokenExpiry
        });
        return sendJson(res, 200, { ok: true, token: newToken });
    } catch (error) {
        return sendJson(res, 401, { ok: false, error: 'INVALID_TOKEN' });
    }
}


module.exports = { register, login, checkToken, renewToken };
