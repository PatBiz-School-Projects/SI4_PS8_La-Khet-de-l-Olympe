const { readJsonBody, sendJson } = require("../helpers/parser");
const { extractToken, extractUserId } = require("../helpers/token");

const network = require("./network");

const connectedUsersService = require("../managers/connectedUsersService");
const usersRepository = require("../repositories/userRepository");
const friendshipManager = require("../managers/friendshipManager");
const achievementsManager = require("../managers/achievementsManager");


exports.createUser = async (req, res) => {
    const { authId: userId, username } = await readJsonBody(req);
    if (!userId || !username) {
        const errMsg = "Missing fields in request body to create user";
        console.error(errMsg);
        sendJson(res, 400, { ok: false, error: errMsg });
        return;
    }

    const alreadyExists = Boolean(await usersRepository.findUserByAuthId(userId));
    if (alreadyExists) {
        const errMsg = "User already exists";
        console.error(errMsg);
        sendJson(res, 409, { ok: false, error: errMsg });
        return;
    }

    try {
        await usersRepository.createUser(userId, username);
    } catch (err) {
        console.error("Internal error occurred while creating new user:", err);
        sendJson(res, 500, { ok: false, error: err.message });
        return;
    }

    const createdUser = await usersRepository.findUserByAuthId(userId);

    network.bus.publish("created-new-user", {
        userId,
        username: createdUser.username,
        profilePicture: createdUser.profilePicture,
        elo: createdUser.elo,
        totalGames: createdUser.totalGames,
        totalWins: createdUser.totalWins,
        totalLosses: createdUser.totalLosses,
        totalDraws: createdUser.totalDraws,
        achievements: createdUser.achievements,
    });

    sendJson(res, 201, {
        ok: true,
        id: userId,
    });
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
        const { userId} = body;
        if (!userId) {
            sendJson(res, 400, { ok: false, error: 'MISSING_USER_ID' });
            return;
        }

        return sendJson(res, 200, {
            connected: connectedUsersService.isUserConnected(userId),
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
    const token = extractToken(req, null);
    if (!token) {
        sendJson(res, 401, "MISSING_TOKEN");
        return;
    }

    const { userId } = req.routeParams;

    const user = await usersRepository.findUserByAuthId(userId);
    if (!user) {
        sendJson(res, 404, "USER_NOT_FOUND");
        return;
    }

    try{
        const newAchievements = achievementsManager.checkNewAchievements(user);

        if (newAchievements.length > 0) {
            const newAchievementIds = newAchievements.map(a => a.id);
            await usersRepository.addAchievements(user.id, newAchievementIds);
        }

        const userFriends = await friendshipManager.getAllFriends(userId);
        return sendJson(res, 200, {
            username: user.username,
            profilePicture: user.profilePicture,
            elo: user.elo,
            friends: userFriends,
            achievements:user.achievements||[],
            stats:{
                winStreak: user.winStreak,
                totalGames: user.totalGames,
                totalLosses: user.totalLosses,
                totalWins : user.totalWins,
                winRate: user.totalGames > 0
                    ? Math.round(((user.totalWins ?? 0) / user.totalGames) * 100)
                    : 0,
            },
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
    const user = await usersRepository.findUserByAuthId(userId);
    if (!user) {
        const errMsg = `No user of id '${userId}' found`;
        console.error(errMsg);
        sendJson(res, 404, {ok: false, error: errMsg});
        return;
    }

    sendJson(res, 200, {
        username: user.username,
        profilePicture: user.profilePicture,
    });
}

exports.getAchievementsCatalogue = async (req, res) => {

    try{
        const catalogue = achievementsManager.getAchievementsCatalogue();

        if (!catalogue) {
            return sendJson(res, 404, { ok: false, error: "CATALOGUE_NOT_FOUND" });
        }

        return sendJson(res,200,{ ok: true, catalogue });
    }catch (error) {
        console.error("Erreur getAchievementsCatalogue:", error);
        return sendJson(res, 500, { ok: false, error: "INTERNAL_SERVER_ERROR" });
    }
}

exports.findUsers =  async (req, res) => {
    try{
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
        const rawLimit = req.queryParams.limit;

        if (!rawLimit) {
            return sendJson(res, 400, "MISSING_LIMIT");
        }
        const limit = Number.parseInt(rawLimit);
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
    const user = await usersRepository.findUserByAuthId(userId);
    if (!user) {
        const errMsg = `No user of id '${userId}' found`;
        console.error(errMsg);
        sendJson(res, 404, {ok: false, error: errMsg});
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
    const user = await usersRepository.findUserByAuthId(userId);
    if (!user) {
        const errMsg = `No user of id '${userId}' found`;
        console.error(errMsg);
        sendJson(res, 404, {ok: false, error: errMsg});
        return;
    }

    sendJson(res, 200, {
        username: user.username,
        elo: user.elo,
        liveWinStreak: user.winStreak,
        // Add more if needed
    });
}

exports.updateUserProfilePicture = async (req, res) => {
    const { userId } = req.routeParams;

    const user = await usersRepository.findUserByAuthId(userId);
    if (!user) {
        const errMsg = `No user of id '${userId}' found`;
        console.error(errMsg);
        sendJson(res, 404, {ok: false, error: errMsg});
        return;
    }

    const { profilePicture } = await readJsonBody(req);
    if (!profilePicture) {
        const errMsg = "Malformed request body: Missing 'profilePicture' attribute";
        console.error(errMsg);
        sendJson(res, 400, { ok: false, error: errMsg });
        return;
    }

    let updatedUser;
    try {
        updatedUser = await usersRepository.updateProfilePicture(userId,profilePicture);
    } catch (err) {
        const errorMsg = `Internal Error: Failed to update user's profile picture bcs: ${err.message}`;
        console.error(errorMsg);
        sendJson(res, 500, { ok: false, error: errorMsg });
        return;
    }

    sendJson(res, 200, {ok: true, success: true});

    network.bus.publish("updated-user-profile", {
        userId,
        update: {
            username: updatedUser.username,
            profilePicture: updatedUser.profilePicture,
        },
    });
}

exports.updateUserStats = async (req, res) => {
    const { userId } = req.routeParams;
    const user = await usersRepository.findUserByAuthId(userId);
    if (!user) {
        const errMsg = `No user of id '${userId}' found`;
        console.error(errMsg);
        sendJson(res, 404, {ok: false, error: errMsg});
        return;
    }

    const update = await readJsonBody(req);

    const updatedUser = await usersRepository.updateUserStats(userId, update);
    if (!updatedUser) {
        return sendJson(res, 500, { ok: false, error: "Failed to update stats" });
    }

    const newAchievements = await updateUserAchievements(updatedUser);

    sendJson(res, 200, {
        ok: true,
        success: true,
        newAchievements: newAchievements
    });
}

async function updateUserAchievements(user) {
    const newAchievements = achievementsManager.checkNewAchievements(user);

    if (newAchievements.length > 0) {
        const newAchievementIds = newAchievements.map(a => a.id);
        await usersRepository.addAchievements(user.id, newAchievementIds);
    }

    return newAchievements;
}
