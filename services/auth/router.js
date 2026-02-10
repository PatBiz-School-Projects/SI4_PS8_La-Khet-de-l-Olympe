const handler = require('./handler.js');

const routes = {
    "/api/auth/login" : (req, res) => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        return res.end(JSON.stringify({
            ok : true,
            token : 2
        }));
    },
    "/api/auth/signup" : (req, res) => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        return res.end(JSON.stringify({
            ok : true,
            token : 2
        }));
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