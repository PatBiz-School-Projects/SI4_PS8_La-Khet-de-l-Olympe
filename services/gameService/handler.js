const { readJsonBody, sendJson, parseCookies } = require("./helpers/parser");

const { GamesManager } = require("./GamesManager");
const { Player } = require("./Player");


exports.startSoloGame = async (req, res) => {
    // TODO : Implement once the AI has been implemented
}


exports.startLocalMultiplayerGame = async (req, res) => {
    let player1, player2;
    try {
        const { playerId1, playerId2 } = await readJsonBody(req);
        player1 = new Player(playerId1);
        player2 = new Player(playerId2);
    } catch (err) {
        console.error(err)
        sendJson(res, 400, { ok: false, error: err });
        return;
    }

    const gameId = GamesManager.newGame();
    GamesManager.registerPlayerInRoom(player1, gameId);
    GamesManager.registerPlayerInRoom(player2, gameId);

    sendJson(res, 200, { ok:true, gameId });
}


exports.joinMultiplayerGame = async (req, res) => {
    let player;
    try {
        const { playerId } = await readJsonBody(req);
        player = new Player(playerId);
    } catch (err) {
        console.error(err)
        sendJson(res, 400, { ok: false, error: err });
        return;
    }

    const gameId = GamesManager.findRoomFor(player);

    sendJson(res, 200, { ok:true, gameId });
}


exports.action = async (req, res) => {
    try {
        const { gameId } = parseCookies(req.headers.cookie);
        const game = GamesManager.getGameById(gameId);

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
            sendJson(res, 200, { ok:true, ...actionResult });
            return;
        }

        //const laserResult = game.processLaserHit();
        console.log(`grid: ${actionResult.grid}`);
        const finalResult = {
            grid: actionResult.grid,
            //laser: laserResult.path,
        };

        game.nextTurn();
        sendJson(res, 200, { ok:true, ...finalResult });
    } catch (err) {
        console.error(err)
        sendJson(res, 400, { ok: false, error: err });
    }
}


exports.getPiece = async (req, res) => {
    const { gameId } = parseCookies(req.headers.cookie);
    const game = GamesManager.getGameById(gameId);

    const body = await readJsonBody(req);
    const {x, y} = body;

    try {
        const piece = game.board.getPieceAt({x, y});
        sendJson(res, 200, { ok:true, ...piece.toDTO() });
    } catch (err) {
        console.error(err);
        sendJson(res, 400, { ok: false, error: err });
    }
}


exports.getBoard = async (req, res) => {
    const { gameId } = parseCookies(req.headers.cookie);
    const game = GamesManager.getGameById(gameId);

    sendJson(res, 200, { ok:true, ...game.board.toDTO() });
}
