const friendshipService = require("../managers/friendshipManager")
const {extractToken,extractUserId} = require("../helpers/token");
const {readJsonBody,sendJson} = require("../helpers/parser");
const {mapError} = require("../utils/error");
const {isUserPresent} = require("../managers/friendshipManager");

async function parseBodyAndExtractUserId(req){
    const parsedBody = await readJsonBody(req);
    const token = extractToken(req,null); // TODO : faudra s'assurer de toujours envoyer le token dans le header de la requete
    if (!token) {
        throw new Error('MISSING_TOKEN');
    }

    return {
        currentUserId: extractUserId(token),
        body: parsedBody,
    };
}

exports.handleSendRequest = async (req, res) => {
    try {
        const { currentUserId, body } = await parseBodyAndExtractUserId(req);
        const targetUserId = body.targetUserId;

        if (!targetUserId) {
            return sendJson(res, 400, { ok: false, error: 'MISSING_TARGET_USER_ID' });
        }

        const result = await friendshipService.requestFriendship(currentUserId, targetUserId);
        return sendJson(res, 201, { ok: true, friendship: result });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
}

exports.handleAcceptRequest = async (req, res) => {
    try {
        const { currentUserId, body } = await parseBodyAndExtractUserId(req);
        const requestUserId = body.requestUserId;
        if(!await friendshipService.isUserPresent(requestUserId) || !await isUserPresent(currentUserId)){
            return sendJson(res,400,{ok:false,error:"USER_NOT_FOUND"})
        }

        if (!requestUserId) {
            return sendJson(res, 400, { ok: false, error: 'MISSING_REQUEST_USER_ID' });
        }

        await friendshipService.acceptFriendship(currentUserId, requestUserId);
        return sendJson(res, 200, { ok: true });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
}

exports.handleDeleteRequest = async (req, res) => {
    try {
        const { currentUserId, body } = await parseBodyAndExtractUserId(req);
        const userId = body.userId;

        if (!userId) {
            return sendJson(res, 400, { ok: false, error: 'MISSING_USER_ID' });
        }

        await friendshipService.declineOrCancelRequest(currentUserId, userId);
        return sendJson(res, 200, { ok: true });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
}

exports.handleDeleteFriend = async (req, res) => {
    try {
        const { currentUserId, body } = await parseBodyAndExtractUserId(req);
        const friendId = body.friendId;

        if (!friendId) {
            return sendJson(res, 400, { ok: false, error: 'MISSING_FRIEND_ID' });
        }

        await friendshipService.removeFriend(currentUserId, friendId);
        return sendJson(res, 200, { ok: true });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
}

exports.handleListFriends = async (req, res) => {
    try {
        const { currentUserId } = await parseBodyAndExtractUserId(req, {});
        const friends = await friendshipService.getAllFriends(currentUserId);
        return sendJson(res, 200, { ok: true, friends });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
}

exports.handleListRequests = async (req, res) => {
    try {
        const { currentUserId } = await parseBodyAndExtractUserId(req, {});
        const requests = await friendshipService.listReceivedRequests(currentUserId);
        return sendJson(res, 200, { ok: true, requests });
    } catch (error) {
        const [status, message] = mapError(error);
        return sendJson(res, status, { ok: false, error: message });
    }
}
