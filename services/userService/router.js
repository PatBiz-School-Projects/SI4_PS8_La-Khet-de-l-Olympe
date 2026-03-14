const handler = require('./handler');

const routes = {
    "/api/users": async (request, response) => {
        handler.createUser(request, response);
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
