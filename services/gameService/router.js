const handler = require('./handler.js');

const routes = {
    '/api/init-board': (req, res) => {
        //méthode du middleWare
        handler.initBoard(req, res);
    },
    '/api/action' : (req, res) => {
        handler.action(req, res);
    },
    '/api/board/piece' : (req, res) => {
        handler.getPiece(req, res);
    },
    '/api/board' : (req, res) => {
        handler.getBoard(req, res);
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