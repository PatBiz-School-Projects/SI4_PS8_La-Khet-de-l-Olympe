const { getDb } = require("../repositories/mongo");
const { readJsonBody, sendJson } = require("../helpers/parser");
const connectedUsersService = require("../managers/connectedUsersService");
const {extractToken,extractUserId} = require("../helpers/token");
const usersRepository = require("../repositories/userRepository");
const {computeEloWithWinStreak} = require("../utils/elo");
const gamesRepository = require("../repositories/gamesRepository");


async function createUser(req, res) {
    try {
        const body = await readJsonBody(req);
        const { authId, username } = body;

        if (!authId || !username) {
            sendJson(res, 400, { ok: false, error: "MISSING_FIELDS" });
            return;
        }

        const existing = await usersRepository.findUserByAuthId(authId);

        if (existing) {
            sendJson(res, 409, { ok: false, error: "ALREADY_EXISTS" });
            return;
        }

        const result = await usersRepository.createUser(authId,username);

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
            connected: connectedUsersService.isUserConnected(authId),
        });
    }
    catch (error) {
        throw new Error(error);
    }
}

async function connectUser(req,res){
    try{
        const token = extractToken(req,null);
        if (!token) {
            sendJson(res, 401, "MISSING_TOKEN");
            return;
        }
        const userId = extractUserId(token);
        const user = await usersRepository.findUserByAuthId(userId);
        if (!user) {
            sendJson(res,404,"USER_NOT_FOUND");
            return;
        }
        connectedUsersService.addConnectedUser(user.gameUserDTO());
        sendJson(res, 200, {});
    }
    catch (error) {
        console.log(error)
        sendJson(res, 500, {error:error});
    }
}

async function disconnectUser(req,res){
    try{
        const token = extractToken(req,null);
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

async function getProfile(req,res){
    try{
        const token = extractToken(req,null);
        if (!token) {
            sendJson(res, 401, "MISSING_TOKEN");
            return;
        }
        const userId = extractUserId(token);
        const user = await usersRepository.findUserByAuthId(userId);
        if (!user) {
            sendJson(res, 404, "USER_NOT_FOUND");
            return;
        }
        const userFriends = []; // TODO: fetch real user friends when implemented
        return sendJson(res, 200, {
            username: user.username,
            profilePicture: user.profilePicture,
            elo: user.elo,
            friends: userFriends
        });
    }
    catch (error) {
        console.error("getProfile error:", error);
        return sendJson(res, 500, "INTERNAL_SERVER_ERROR");
    }
}

async function getPublicProfile(req,res){
    try{
        const userId = req.params.userId;
        const user = await usersRepository.findUserByAuthId(userId);
        if(!user){
            sendJson(res, 404, "USER_NOT_FOUND");
            return;
        }
        return sendJson(res,200,{
            username: user.username,
            elo:user.elo,
            profilePicture: user.profilePicture,
        })
    }
    catch (error) {
        console.error("getPublicProfile error:", error);
        return sendJson(res, 500, "INTERNAL_SERVER_ERROR");
    }
}

async function onEloChange(req,res){
    try{
        const body = await readJsonBody(req);
        console.log(body)
        const {gameId,winnerId,loserId}=body;
        const winnerUser = await usersRepository.findUserByAuthId(winnerId);
        const loserUser = await usersRepository.findUserByAuthId(loserId);
        if(!winnerUser || !loserUser){
            return sendJson(res, 404, "ONE_USER_NOT_FOUND");
        }
        const game = await gamesRepository.findGameById(gameId);
        if(game){
            return sendJson(res, 200, {
                ok: true,
                applied: false,
                reason: "ALREADY_PROCESSED",
                match: game,
            });
        }
        const {winner,loser} = computeEloWithWinStreak({
            winnerRating : winnerUser.elo,
            loserRating: loserUser.elo,
            winnerWinStreak: winnerUser.winStreak
        })

        const matchRecord = {
            gameId,
            winnerId,
            loserId,
            winner,
            loser,
        };

        await gamesRepository.createGame(matchRecord);

        await usersRepository.updateWinnerElo(winnerId,winner.newRating);
        await usersRepository.updateLoserElo(loserId,loser.newRating);
        return sendJson(res, 200, {
            ok: true,
            applied: true,
            match : matchRecord
        });
    }
    catch (error) {
        console.error("applyMatchResult error:", error);
        return sendJson(res, 500, {
            ok: false,
            error: String(error?.message ?? error),
        });
    }
}


module.exports = { createUser ,getConnectedUsers,isUserConnected,connectUser,disconnectUser,getProfile,getPublicProfile,onEloChange };
