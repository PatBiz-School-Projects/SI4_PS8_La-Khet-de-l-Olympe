const { getDb } = require('./mongo');

const routes = {
    "/api/users": async (request, response) => {
        try {
            const db = await getDb();
            const users = await db.collection('users').find().toArray();

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(users));
        } catch (error) {
            console.error(error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
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
