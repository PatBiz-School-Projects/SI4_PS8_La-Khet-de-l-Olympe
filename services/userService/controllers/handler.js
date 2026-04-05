const { readJsonBody, sendJson } = require("../helpers/parser");
const { extractToken, extractUserId } = require("../helpers/token");

const connectedUsersService = require("../managers/connectedUsersService");
const usersRepository = require("../repositories/userRepository");
const friendshipManager = require("../managers/friendshipManager");


exports.createUser = async (req, res) => {
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

exports.getConnectedUsers = async (req, res) => {
    return sendJson(res,200,{
        ok:true,
        users: connectedUsersService.getConnectedUsers()
    });
}

exports.isUserConnected = async (req, res) => {
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
    } catch (error) {
        throw new Error(error);
    }
}

exports.connectUser = async (req, res) => {
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
    } catch (error) {
        console.log(error)
        sendJson(res, 500, {error:error});
    }
}

exports.disconnectUser = async (req, res) => {
    try{
        const token = extractToken(req,null);
        if (!token) {
            sendJson(res, 401, "MISSING_TOKEN");
            return;
        }
        const userId = extractUserId(token);
        connectedUsersService.disconnectUser(userId);
        sendJson(res, 200, {});
    } catch (error) {
        sendJson(res, 500, {});
    }
}

exports.getProfile = async (req, res) => {
    try{
        const token = extractToken(req, null);
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
        const userFriends = await friendshipManager.getAllFriends(userId);
        return sendJson(res, 200, {
            username: user.username,
            profilePicture: user.profilePicture,
            elo: user.elo,
            friends: userFriends,
            stats:{
                winStreak: user.winStreak,
                totalGames: user.totalGames,
                totalLosses: user.totalLosses,
                totalWins : user.totalWins,
                winRate: user.totalGames > 0
                    ? Math.round(((user.totalWins ?? 0) / user.totalGames) * 100)
                    : 0,
            }
        });
    } catch (error) {
        console.error("getProfile error:", error);
        sendJson(res, 500, "INTERNAL_SERVER_ERROR");
        return;
    }
}

exports.getPublicProfile = async (req, res) => {
    const { userId } = req.routeParams;

    try{
        const user = await usersRepository.findUserByAuthId(userId);
        if (!user) {
            sendJson(res, 404, "USER_NOT_FOUND");
            return;
        }
        return sendJson(res,200,{
            username: user.username,
            elo:user.elo,
            profilePicture: user.profilePicture,
            stats:{
                totalGames: user.totalGames,
                totalWins : user.totalWins,
                totalLosses: user.totalLosses,
                winStreak: user.winStreak,
                winRate: user.totalGames > 0
                    ? Math.round(((user.totalWins ?? 0) / user.totalGames) * 100)
                    : 0,
            }
        });
    } catch (error) {
        console.error("getPublicProfile error:", error);
        sendJson(res, 500, "INTERNAL_SERVER_ERROR");
        return;
    }
}

exports.getUserMinimalProfile = async (req, res) => {
    const { userId } = req.routeParams;

    let user;
    try {
        user = await usersRepository.findUserByAuthId(userId);
        if (!user) {
            throw new Error(`No user found with id: '${userId}'`);
        }
    } catch (err) {
        console.error(err);
        sendJson(res, 404, {ok: false, error: err.message});
        return;
    }

    sendJson(res, 200, {
        username: user.username,
        profilePicture: user.profilePicture,
    });
}

exports.findUsers =  async (req, res) => {
    try{
        const token = extractToken(req, null);

        if (!token) {
            sendJson(res, 401, { ok: false, error: "MISSING_TOKEN" });
            return;
        }
        const {query} = req.queryParams;
        const users = await usersRepository.findUserByQuery(query,5);
        const response = users.map((user) => ({
            username:user.username,
            profilePicture:user.profilePicture,
            userId:user._id
        }));
        sendJson(res, 200, response);}
    catch(err){
        console.log(err);
        sendJson(res, 500, "INTERNAL_SERVER_ERROR");
    }
}

exports.getLeaderboard = async (req, res) => {
    try {
        const {limit} = req.queryParams;

        if (!limit) {
            return sendJson(res, 400, "MISSING_LIMIT");
        }
        const users = await usersRepository.findTopUsersByElo(limit);
        sendJson(res, 200, users);
    }
    catch(err){
        console.log(err);
        sendJson(res, 500, "INTERNAL_SERVER_ERROR");
    }
}

exports.getUserStats = async (req, res) => {
    const { userId } = req.routeParams;

    let user;
    try {
        user = await usersRepository.findUserByAuthId(userId);
        if (!user) {
            throw new Error(`No user found with id: '${userId}'`);
        }
    } catch (err) {
        console.error(err);
        sendJson(res, 404, {ok: false, error: err.message});
        return;
    }

    sendJson(res,200,{
        totalGames: user.totalGames,
        totalWins : user.totalWins,
        totalLosses: user.totalLosses,
        winStreak: user.winStreak,
        winRate: user.totalGames > 0
            ? Math.round(((user.totalWins ?? 0) / user.totalGames) * 100)
            : 0,
    });
}

exports.getUserLiveStats = async (req, res) => {
    const { userId } = req.routeParams;

    let user;
    try {
        user = await usersRepository.findUserByAuthId(userId);
        if (!user) {
            throw new Error(`No user found with id: '${userId}'`);
        }
    } catch (err) {
        console.error(err);
        sendJson(res, 404, {ok: false, error: err.message});
        return;
    }

    sendJson(res, 200, {
        elo: user.elo,
        liveWinStreak: user.winStreak,
        // Add more if needed
    });
}
exports.updateUserProfilePicture = async (req,res) =>{
    try{

        const userId =  await checkExistingUser(req,res);
        if(!userId) return;
        const body = await readJsonBody(req);
        const { profilePicture } = body;

        if (!profilePicture) {
            return sendJson(res, 400, { ok: false, error: "Profile Picture is missing." });
        }

        await usersRepository.updateProfilePicture(userId,profilePicture);

        sendJson(res, 200, {ok: true, success: true});

    }catch (err){
        console.error(err);
        sendJson(res, 500, { ok: false, error: "Update Profile Picture Impossible." });
    }


}

checkExistingUser = async (req, res) => {
    const { userId } = req.routeParams;
    let user;
    try{
        user = await usersRepository.findUserByAuthId(userId);

        if (!user) {
            sendJson(res, 404, { ok: false, error: `No user found with id: '${userId}'` });
            return null;
        }

        return userId

    }catch (err){
        console.error(err);
        sendJson(res, 404, {ok: false, error: err.message});
    }
}

exports.updateUserStats = async (req, res) => {
    const userId = await checkExistingUser(req,res);
    if(!userId) return;

    const update = await readJsonBody(req);

    await usersRepository.updateUserStats(userId, update);

    sendJson(res, 200, {ok: true, success: true});
}
