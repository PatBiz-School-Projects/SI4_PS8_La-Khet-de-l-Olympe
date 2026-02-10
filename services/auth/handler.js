const { getDb } = require("./mongo");
const hash = require("js-sha256");
const { readJsonBody, sendJson } = require("./helpers/parser");

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

async function login(req, res) {}

module.exports = { register, login };
