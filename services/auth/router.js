const handler = require('./handler.js');

const routes = {
    "/api/auth/login" : (req, res) => {
        handler.login(req, res);
    },
    "/api/auth/signup" : (req, res) => {
        handler.register(req, res);
    },
    "/api/auth/renew" : (req, res) => {
        handler.renewToken(req, res);
    },
    "/api/auth/check" : (req, res) => {
        handler.checkToken(req, res);
    },
    "/api/auth/forgot-password" : (req, res) => {
        handler.resetPassword(req, res);
    },
    "/api/auth/forgot-password/question" : (req, res) => {
        handler.getQuestion(req, res);
    },
    "/api/auth/logout" : (req, res) => {
        handler.logout(req, res);
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
