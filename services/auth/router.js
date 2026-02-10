const handler = require('./handler.js');

const routes = {
    "/api/auth/login" : (req, res) => {
        handler.login(req, res);
    },
    "/api/auth/signup" : (req, res) => {
        handler.register(req, res);
    }
};

async function manage(request,response){
    const url = request.url;
    if(routes[url]){
        await routes[url](request, response);
    }
    else{
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end(JSON.stringify({error: 'Not Found'}));
    }
}

module.exports = {manage};