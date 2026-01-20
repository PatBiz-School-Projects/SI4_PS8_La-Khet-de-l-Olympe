const readJsonBody = require("../helpers/parser");
const BoardManager = require("./manager/boardManager");
const GameState = require("./manager/gameState");
const boardManager = new BoardManager();
const gameState = new GameState();
async function placePiece(req,res){
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

async function movePiece(req,res){
    try{
        const { fromX,fromY,owner,toX,toY} = await readJsonBody(req);
        console.log(fromX, fromY, toX, toY);
        const isOwnersTurn = gameState.isPlayersTurn(owner);
        if(!isOwnersTurn){
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ok:false,error:"NOT_YOUR_TURN"}));
        }
        const result = boardManager.movePiece(fromX,fromY,toX,toY);
        if(!result.ok){
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(result));
        }
        gameState.addTurn();
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(result));
    } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
    }
}

function initBoard(req,res){
    const data = boardManager.initBoard(req,res);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "success", detail: "Board initialisée", grid: data.grid, currentPlayer:data.currentPlayer }));
}

module.exports = {initBoard,movePiece,placePiece};
