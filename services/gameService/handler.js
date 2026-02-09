const readJsonBody = require("../helpers/parser");
const BoardManager = require("./manager/boardManager");
const Game = require("./manager/game");
const LaserService = require("./manager/laserService")
const boardManager = new BoardManager();
const laserService = new LaserService(boardManager.getBoard().board);
const game = new Game([1,2],boardManager,laserService);
const ACTIONS = require("./action");

async function action(req,res){
    try{
        const body = await readJsonBody(req);
        const { method, args } = body ?? {};
        const methodToCall = ACTIONS[method];
        if (!methodToCall) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "INVALID_METHOD" }));
        }
        const owner = args?.owner;
        if (owner == null) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "MISSING_OWNER" }));
        }
        if (!game.isPlayersTurn(owner)) {
            console.log(game.getCurrentPlayer());
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "NOT_YOUR_TURN" }));
        }
        const result = methodToCall(boardManager,{args});
        if(!result.ok){
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(result));
        }
        if(methodToCall==="switch"){
            game.addTurn();
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(result));
        }
        const laserResult=game.proceedLaserHit();

        const finalResult = {
            grid:result.grid,
            laser: laserResult.path
        };

        game.addTurn();
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(finalResult));
    } catch (e) {
        console.log(e)
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
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
