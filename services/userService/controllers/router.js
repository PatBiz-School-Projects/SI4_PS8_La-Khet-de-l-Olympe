const { Router } = require("../helpers/router");

const HTTPUsersHandler = require('./handler');
const HTTPFriendsHandler = require('./friendshipHandler');


const ROUTER = (new Router()
    .add("/api/users", {
        POST: HTTPUsersHandler.createUser,
    })
    .add("/api/users/:userId/", {
        GET: HTTPUsersHandler.getPublicProfile,
    })
    .add("/api/users/connected", {
        GET: HTTPUsersHandler.getConnectedUsers,
    })
    .add("/api/users/connected/is-connected", {
        GET: HTTPUsersHandler.isUserConnected,
    })
    .add("/api/users/connect", {
        POST: HTTPUsersHandler.connectUser,
    })
    .add("/api/users/disconnect", {
        POST: HTTPUsersHandler.disconnectUser,
    })
    .add("/api/users/profile", {
        GET: HTTPUsersHandler.getProfile,
    })
    .add("/api/users/elo/match-result", {
        POST: HTTPUsersHandler.onEloChange,
    })
    .add("/api/users/friends", {
        GET: HTTPFriendsHandler.handleListFriends,
        DELETE: HTTPFriendsHandler.handleDeleteFriend,
    })
    .add("/api/users/friends/accept", {
        POST: HTTPFriendsHandler.handleAcceptRequest,
    })
    .add("/api/users/friends/request", {
        POST: HTTPFriendsHandler.handleSendRequest,
        DELETE: HTTPFriendsHandler.handleDeleteRequest,
    })
    .add("/api/users/friends/requests", {
        GET: HTTPFriendsHandler.handleListRequests
    })
);


exports.manage = async (req, res) => {
    ROUTER.handle(req, res);
}
