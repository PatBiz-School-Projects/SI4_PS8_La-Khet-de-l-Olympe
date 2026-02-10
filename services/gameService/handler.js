const {readJsonBody,sendJson} = require("./helpers/parser");
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
            return sendJson(res,400,{ ok: false, error: "INVALID_METHOD" });
        }
        const owner = args?.owner;
        if (owner == null) {
            return sendJson(res,400,{ ok: false, error: "MISSING_OWNER" });
        }
        if (!gameState.isPlayersTurn(owner)) {
            return sendJson(res,400,{ ok: false, error: "NOT_YOUR_TURN" })
        }
        const result = methodToCall(boardManager,{args});
        if(!result.ok){
            return sendJson(res,200,result);
        }
        if(!method==="place")gameState.addTurn();
        sendJson(res,200,result);
    } catch (e) {
        console.log(e)
        return sendJson(res,400,e);
    }
}

function initBoard(req,res){
    const result = boardManager.initBoard();
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "success", detail: "Board initialisée", grid: result.grid}));
}

async function getPiece(req,res){
    const body = await readJsonBody(req);
    const { x,y } = body;
    const result = boardManager.getPiece(x,y);
    if(!result.ok){
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(result));
    }
    res.writeHead(201, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result));
}

async function getBoard(req,res){
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(boardManager.getBoard()));
}

module.exports = {initBoard,action,getPiece,getBoard};
