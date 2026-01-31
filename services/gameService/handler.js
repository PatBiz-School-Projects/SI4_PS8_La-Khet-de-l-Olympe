const readJsonBody = require("../helpers/parser");
const BoardManager = require("./manager/boardManager");
const GameState = require("./manager/gameState");
const boardManager = new BoardManager();
const gameState = new GameState();
const ACTIONS = require("./action");

async function action(req,res){
    try{
        const body = await readJsonBody(req);
        const { method, args } = body ?? {};
        const methodToCall = ACTIONS[method]
        if (!methodToCall) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "INVALID_METHOD" }));
        }
        const owner = args?.owner;
        if (owner == null) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "MISSING_OWNER" }));
        }
        if (!gameState.isPlayersTurn(owner)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "NOT_YOUR_TURN" }));
        }
        const result = methodToCall(boardManager,{args});
        if(!result.ok){
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(result));
        }
        if(!method==="place")gameState.addTurn();
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(result));
    } catch (e) {
        console.log(e)
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
    }
}

function initBoard(req,res){
    const data = boardManager.initBoard();
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "success", detail: "Board initialisée", grid: data.grid, currentPlayer:data.currentPlayer }));
}

async function getPiece(req,res){
    const body = await readJsonBody(req);
    const { x,y } = body;
    const result = boardManager.getPiece(x,y);
    if(!result.ok){
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(result));
    }
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result));
}

module.exports = {initBoard,action,getPiece};
