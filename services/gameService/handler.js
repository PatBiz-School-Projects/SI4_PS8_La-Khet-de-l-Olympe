const { readJsonBody, sendJson } = require("./helpers/parser");

const { Game } = require("./manager/game");


const game = new Game([1,2]);


exports.action = async (req, res) => {
    try {
        const actionBody = await readJsonBody(req);
        const { method, args } = actionBody ?? {};

        if (!game.ACTIONS.hasAttribute(method)) {
            throw new Error(`Unknown action method: ${method}`);
        }
        const owner = args?.owner;
        if (owner === null) {
            throw new Error("Missing 'owner' in action");
        }
        if (!game.playerCanPlay(owner)) {
            throw new Error("Player cannot play");
        }

        // TODO : Calling an "action validator" to check whether the action is legal
        if (false) {
            throw new Error(`Invalid action: ${JSON.stringify(actionBody)}`);
        }

        const actionResult = game.ACTIONS[method]({args});

        if(method === "switch"){
            game.nextTurn();
            sendJson(res, 200, actionResult);
            return;
        }

        //const laserResult = game.processLaserHit();
        console.log(`grid: ${actionResult.grid}`);
        const finalResult = {
            grid: actionResult.grid,
            //laser: laserResult.path,
        };

        game.nextTurn();
        sendJson(res, 200, finalResult);
    } catch (err) {
        console.error(err)
        sendJson(res, 400, { ok: false, error: err });
    }
}


exports.initBoard = (req, res) => {
    game.board.init();
    sendJson(res, 201, game.board.toDTO());
}


exports.getPiece = async (req, res) => {
    const body = await readJsonBody(req);
    const {x, y} = body;

    try {
        const piece = game.board.getPieceAt({x, y});
        sendJson(res, 200, piece.toDTO());
    } catch (err) {
        console.error(err);
        sendJson(res, 400, { ok: false, error: err });
    }
}


exports.getBoard = async (req, res) => {
    sendJson(res, 200, game.board.toDTO());
}
