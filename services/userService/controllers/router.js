const handler = require('./handler');

const routes = {
    "/api/users": async (request, response) => {
        await handler.createUser(request, response);
    },
    "/api/users/connected/is-connected": async (request, response) => {
        await handler.isUserConnected(request, response);
    },
    "/api/users/connected": async (request, response) => {
        handler.getConnectedUsers(request, response);
    },
    "/api/users/connect" : async (request, response) => {
        await handler.connectUser(request, response);
    },
    "/api/users/disconnect": async (request, response) => {
        await handler.disconnectUser(request, response);
    },
    "/api/users/profile" : async (request, response) => {
        await handler.getProfile(request, response);
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
