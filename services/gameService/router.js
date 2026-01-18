const Board = require('./entities/board');
const BoardManager = require('./manager/boardManager')
const readJsonBody= require('../helpers/parser.js');

const boardManager = new BoardManager();

const routes = {
    '/api/init-board': (req, res) => {boardManager.initBoard(req, res)},
    '/api/place' : async (req,res) => {
        try {
            const { x, y, piece } = await readJsonBody(req);
            const result = boardManager.placePiece(x, y, piece);

            res.writeHead(result.ok ? 200 : 400, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
        } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
        }
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