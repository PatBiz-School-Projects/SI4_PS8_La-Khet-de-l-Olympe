const { readJsonBody, sendJson } = require('../helpers/parser');
const { extractToken, extractUserId } = require('../helpers/token');
const { createChallenge,listChallenges, acceptChallenge, declineChallenge, cancelChallenge, } = require('./challengeService');
const {mapError} = require("../utils/error");
exports.handleCreateChallenge = async (req, res) => {
    try {
        await onRequest(req, { requireAuth: true, requireBody: true });

        const targetUserId = req.body.targetUserId;
        if (!targetUserId) {
            throw new Error('MISSING_TARGET_USER_ID');
        }

        const challenge = await createChallenge({
            challengerUserId: req.authUserId,
            targetUserId,
            cookieHeader: req.cookieHeader,
        });

        return sendJson(res, 201, { ok: true, challenge });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
};

exports.handleListIncomingChallenges = async (req, res) => {
    try {
        await onRequest(req, { requireAuth: true });

        const challenges = listChallenges(req.authUserId, 'incoming');

        return sendJson(res, 200, { ok: true, challenges });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
};

exports.handleAcceptChallenge = async (req, res) => {
    try {
        await onRequest(req, { requireAuth: true, requireChallengeId: true });

        const challenge = await acceptChallenge({
            challengeId: req.challengeId,
            userId: req.authUserId,
            cookieHeader: req.cookieHeader,
        });

        return sendJson(res, 200, { ok: true, challenge });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
};

exports.handleDeclineChallenge = async (req, res) => {
    try {
        await onRequest(req, { requireAuth: true, requireChallengeId: true });

        const challenge = declineChallenge({
            challengeId: req.challengeId,
            userId: req.authUserId,
        });

        return sendJson(res, 200, { ok: true, challenge });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
};

exports.handleCancelChallenge = async (req, res) => {
    try {
        await onRequest(req, { requireAuth: true, requireChallengeId: true });

        const challenge = cancelChallenge({
            challengeId: req.challengeId,
            userId: req.authUserId,
        });

        return sendJson(res, 200, { ok: true, challenge });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
};

async function onRequest(req, options = {}) {
    const {
        requireAuth = true,
        requireBody = false,
        requireChallengeId = false,
    } = options;

    if (requireAuth) {
        const token = extractToken(req, null);
        if (!token) {
            throw new Error('MISSING_TOKEN');
        }

        const userId = extractUserId(token);
        if (!userId) {
            throw new Error('INVALID_TOKEN');
        }

        req.token = token;
        req.authUserId = userId;
    }

    if (requireBody) {
        req.body = await readJsonBody(req);
    }

    if (requireChallengeId) {
        const challengeId = req.routeParams?.challengeId;
        if (!challengeId) {
            throw new Error('MISSING_CHALLENGE_ID');
        }
        req.challengeId = challengeId;
    }

    req.cookieHeader = req.headers.cookie;
}
