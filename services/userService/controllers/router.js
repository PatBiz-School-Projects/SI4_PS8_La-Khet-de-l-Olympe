const userHandler = require('./handler');
const friendshipHandler = require('./friendshipHandler');

const routes = {
    "POST /api/users": async (request, response) => {
        await userHandler.createUser(request, response);
    },
    "GET /api/users/connected/is-connected": async (request, response) => {
        await userHandler.isUserConnected(request, response);
    },
    "GET /api/users/connected": async (request, response) => {
        userHandler.getConnectedUsers(request, response);
    },
    "POST /api/users/connect" : async (request, response) => {
        await userHandler.connectUser(request, response);
    },
    "POST /api/users/disconnect": async (request, response) => {
        await userHandler.disconnectUser(request, response);
    },
    "GET /api/users/profile" : async (request, response) => {
        await userHandler.getProfile(request, response);
    },
    "POST /api/users/elo/apply-result" : async (request, response) => {
        await userHandler.onEloChange(request, response);
    },
    "POST /api/users/friends/request" : async (request, response) => {
        await friendshipHandler.handleSendRequest(request, response);
    },
    "POST /api/users/friends/accept" : async (request, response) => {
        await friendshipHandler.handleAcceptRequest(request, response);
    },
    "DELETE /api/users/friends/request": async (request, response) => {
        await friendshipHandler.handleDeleteRequest(request, response);
    },
    "DELETE /api/users/friends": async (request, response) => {
        await friendshipHandler.handleDeleteFriend(request, response);
    },
    "GET /api/users/friends" : async (request, response) => {
        await friendshipHandler.handleListFriends(request, response);
    },
    "GET /api/users/friends/requests" : async (request, response) => {
        await friendshipHandler.handleListRequests(request, response);
    }
};

async function manage(request, response) {
    const url = request.url;
    const userIdMatch = url.match(/^\/api\/users\/([^\/]+)$/);

    if (request.method === "GET" && userIdMatch) {
        request.params = { userId: userIdMatch[1] };
        return await userHandler.getPublicProfile(request, response);
    }
    const routeKey = `${request.method} ${url}`
    if (routes[routeKey]) {
        await routes[routeKey](request, response);
    } else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Not Found' }));
    }
}

module.exports = { manage };
