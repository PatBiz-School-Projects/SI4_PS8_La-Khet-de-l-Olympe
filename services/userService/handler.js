const { getDb } = require("./mongo");
const { readJsonBody, sendJson } = require("./helpers/parser");
const {connectedUsersService} = require("./connectedUsersService");
const {extractToken,extractUserId} = require("./helpers/token");
const {findUserByAuthId} = require("./userRepository");


async function createUser(req, res) {
    try {
        const body = await readJsonBody(req);
        const { authId, username } = body;

        if (!authId || !username) {
            sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
            return;
        }

        const db = await getDb();
        const users = db.collection("users");
        const existing = await users.findOne({ _id: authId });

        if (existing) {
            sendJson(res, 409, { ok: false, error: "ALREADY_EXISTS" });
            return;
        }

        const result = await users.insertOne({
            _id: authId,
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

function getConnectedUsers(req,res){
    return sendJson(res,200,{
        ok:true,
        users: connectedUsersService.getConnectedUsers()
    });
}

async function isUserConnected(req, res) {
    try{
        const body = await readJsonBody(req);
        const { authId} = body;
        if (!authId) {
            sendJson(res, 400, { ok: false, error: 'MISSING_AUTH_ID' });
            return;
        }

        return sendJson(res, 200, {
            ok: true,
            authId,
            connected: connectedUsersService.isUserConnected(authId),
        });
    }
    catch (error) {
        throw new Error(error);
    }
}

async function connectUser(req,res){
    try{
        const body = await readJsonBody(req);
        const token = extractToken(body);
        if (!token) {
            sendJson(res, 401, "MISSING_TOKEN");
            return;
        }
        const userId = extractUserId(token);
        const user = await findUserByAuthId(userId);
        if (!user) {
            sendJson(res,404,"USER_NOT_FOUND");
            return;
        }
        connectedUsersService.addConnectedUser(user.gameUserDTO());
        sendJson(res, 200, {});
    }
    catch (error) {
        sendJson(res, 500, {});
    }
}

async function disconnectUser(req,res){
    try{
        const body = await readJsonBody(req);
        const token = extractToken(body);
        if (!token) {
            sendJson(res, 401, "MISSING_TOKEN");
            return;
        }
        const userId = extractUserId(token);
        connectedUsersService.disconnectUser(userId);
        sendJson(res, 200, {});
    }
    catch (error) {
        sendJson(res, 500, {});
    }
}


module.exports = { createUser ,getConnectedUsers,isUserConnected,connectUser,disconnectUser };
