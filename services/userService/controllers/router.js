const userHandler = require('./handler');
const friendshipHandler = require('./friendshipHandler');

const routes = {
    "/api/users": async (request, response) => {
        await userHandler.createUser(request, response);
    },
    "/api/users/connected/is-connected": async (request, response) => {
        await userHandler.isUserConnected(request, response);
    },
    "/api/users/connected": async (request, response) => {
        userHandler.getConnectedUsers(request, response);
    },
    "/api/users/connect" : async (request, response) => {
        await userHandler.connectUser(request, response);
    },
    "/api/users/disconnect": async (request, response) => {
        await userHandler.disconnectUser(request, response);
    },
    "/api/users/profile" : async (request, response) => {
        await userHandler.getProfile(request, response);
    },
    "/api/users/friends/request" : async (request, response) => {
        await friendshipHandler.handleSendRequest(request, response);
    },
    "/api/users/friends/accept" : async (request, response) => {
        await friendshipHandler.handleAcceptRequest(request, response);
    },
    "/api/users/friends/cancel": async (request, response) => {
        await friendshipHandler.handleDeleteRequest(request, response);
    },
    "/api/users/friends/remove": async (request, response) => {
        await friendshipHandler.handleDeleteRequest(request, response);
    },
    "/api/users/friends" : async (request, response) => {
        await friendshipHandler.handleListFriends(request, response);
    },
    "/api/users/friends/requests" : async (request, response) => {
        await friendshipHandler.handleListRequests(request, response);
    }
};

async function manage(request, response) {
    const url = request.url;

    if (routes[url]) {
        await routes[url](request, response);
    } else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Not Found' }));
    }
}

module.exports = { manage };
