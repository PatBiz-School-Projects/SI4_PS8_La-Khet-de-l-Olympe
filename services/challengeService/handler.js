const { readJsonBody, sendJson } = require('./helpers/parser');
const { extractToken, extractUserId } = require('./helpers/token');
const { createChallenge } = require('./challengeService');
const {mapError} = require("./utils/error");
exports.handleCreateChallenge = async (req, res) => {
    try {
        const token = extractToken(req, null);
        if (!token) {
            throw new Error('MISSING_TOKEN');
        }

        const challengerUserId = extractUserId(token);
        if (!challengerUserId) {
            throw new Error('INVALID_TOKEN');
        }

        const body = await readJsonBody(req);
        const targetUserId = body.targetUserId;

        if (!targetUserId) {
            throw new Error('MISSING_TARGET_USER_ID');
        }

        const cookieHeader = req.headers.cookie;
        const challenge = await createChallenge({
            challengerUserId,
            targetUserId,
            cookieHeader,
        });

        return sendJson(res, 201, { ok: true, challenge });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
};
