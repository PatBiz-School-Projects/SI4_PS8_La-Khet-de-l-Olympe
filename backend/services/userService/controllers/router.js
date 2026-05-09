const { Router } = require("../helpers/router");
const { public, authenticated } = require("../helpers/middlewares");

const HTTPUsersHandler = require('./handler');
const HTTPFriendsHandler = require('./friendshipHandler');


const ROUTER = (new Router()
    .add("/internal/api/users", {
        POST: HTTPUsersHandler.createUser,
    })
    .add("/api/users?query={}", {
        GET: public(HTTPUsersHandler.findUsers),
    })
    .add("/api/users/:userId/", {
        GET: public(HTTPUsersHandler.getPublicProfile),
    })
    .add("/api/users/leaderboard?limit={}",{
        GET: public(HTTPUsersHandler.getLeaderboard),
    })
    .add("/internal/api/users/connect", {
        POST: HTTPUsersHandler.connectUser,
    })
    .add("/internal/api/users/disconnect", {
        POST: HTTPUsersHandler.disconnectUser,
    })
    .add("/api/users/connected", {
        GET: authenticated(HTTPUsersHandler.getConnectedUsers),
    })
    .add("/api/users/connected/is-connected", {
        GET: authenticated(HTTPUsersHandler.isUserConnected),
    })

    .add("/api/users/:userId/profile", {
        GET: public(HTTPUsersHandler.getProfile),
    })
    // REVIEW : Better route
    // .add("/api/users/:userId/profile?view=public", {
    //     GET: public(HTTPUsersHandler.getUserMinimalProfile)
    // })
    .add("/api/users/:userId/public-profile", {
        GET: public(HTTPUsersHandler.getPublicProfile),
    })
    // REVIEW : Better route
    // .add("/api/users/:userId/profile?view=minimal", {
    //     GET: public(HTTPUsersHandler.getUserMinimalProfile)
    // })
    .add("/api/users/:userId/minimal-profile", {
        GET: public(HTTPUsersHandler.getUserMinimalProfile),
    })

    .add("/api/users/:userId/profilePicture",{
        PUT: authenticated(HTTPUsersHandler.updateUserProfilePicture),
    })

    .add("/internal/api/users/:userId/stats", {
        POST: HTTPUsersHandler.updateUserStats,
    })
    .add("/api/users/:userId/stats", {
        GET: public(HTTPUsersHandler.getUserStats),
    })
    .add("/api/users/:userId/live-stats", {
        GET: public(HTTPUsersHandler.getUserLiveStats),
    })
    .add("/api/users/achievements/catalogue",{
        GET: public(HTTPUsersHandler.getAchievementsCatalogue),
    })
    .add("/api/users/friends", {
        GET: public(HTTPFriendsHandler.handleListFriends),
        DELETE: authenticated(HTTPFriendsHandler.handleDeleteFriend),
    })
    .add("/api/users/friends/accept", {
        POST: authenticated(HTTPFriendsHandler.handleAcceptRequest),
    })
    .add("/api/users/friends/request", {
        POST: authenticated(HTTPFriendsHandler.handleSendRequest),
        DELETE: authenticated(HTTPFriendsHandler.handleDeleteRequest),
    })
    .add("/api/users/friends/requests", {
        GET: authenticated(HTTPFriendsHandler.handleListRequests),
    })
);


exports.manage = async (req, res) => {
    ROUTER.handle(req, res);
}
