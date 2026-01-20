const Board = require('./entities/board');
const BoardManager = require('./manager/boardManager')
const readJsonBody= require('../helpers/parser.js');
const handler = require('./handler.js');

const routes = {
    '/api/init-board': (req, res) => {
        //méthode du middleWare
        handler.initBoard(req, res);
    },
    '/api/place' : (req,res) => handler.placePiece(req,res),
    '/api/move' : (req,res) => handler.movePiece(req,res)
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