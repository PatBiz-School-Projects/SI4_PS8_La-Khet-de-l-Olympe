const { getDb } = require("./mongo");
const { readJsonBody, sendJson } = require("./helpers/parser");

async function createUser(req, res) {
    try {
        const body = await readJsonBody(req);
        const { authId, username } = body;

        if (!authId || !username) {
            return sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
        }

        const db = await getDb();
        const users = db.collection("users");
        const existing = await users.findOne({ authId });

        if (existing) {
            return sendJson(res, 409, { ok: false, error: "ALREADY_EXISTS" });
        }

        const result = await users.insertOne({
            authId,
            username,
            createdAt: new Date(),
            elo : 1000,
            profilePicture : 'img.png'
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

module.exports = { createUser };
