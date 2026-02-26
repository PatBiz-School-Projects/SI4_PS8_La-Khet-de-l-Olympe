const { readJsonBody, sendJson, parseCookies } = require("./helpers/parser");

const { GamesManager } = require("./GamesManager");
const { PlayersManager } = require("./PlayersManager");


exports.newPlayer = async (req, res) => {
    const { userId, userToken } = parseCookies(req.headers.cookie);
    if (!userId) {
        throw new Error("Missing 'userId' cookie");
    }
    if (!userToken) {
        throw new Error("Missing 'userToken' cookie");
    }

    // TODO : Add other verification

    const playerId = PlayersManager.newPlayer(userId, userToken);

    sendJson(res, 200, { ok:true, playerId });
}


exports.startSoloGame = async (req, res) => {
    let player;
    try {
        const { playerId } = await readJsonBody(req);
        player = PlayersManager.getPlayerById(playerId);
    } catch (err) {
        console.error(err)
        sendJson(res, 400, { ok: false, error: err });
        return;
    }

    // TODO : Complete it once the AI has been implemented
}


exports.startLocalMultiplayerGame = async (req, res) => {
    let player1, player2;
    try {
        const { playerId1, playerId2 } = await readJsonBody(req);
        player1 = PlayersManager.getPlayerById(playerId1);
        player2 = PlayersManager.getPlayerById(playerId2);
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
        player = PlayersManager.getPlayerById(playerId);
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

        if (!(method in game.ACTIONS)) {
            throw new Error(`Unknown action method: ${method}`);
        }
        const playerId = args?.playerId;
        if (!playerId) {
            throw new Error("Missing 'playerId' attribute in action");
        }

        const player = PlayersManager.getPlayerById(playerId);
        if (!game.playerCanPlay(player)) {
            throw new Error(`Player of id=${player.id} cannot play`);
        }

        // TODO : Calling an "action validator" to check whether the action is legal
        if (false) {
            throw new Error(`Invalid action: ${JSON.stringify(actionBody)}`);
        }

        const actionResult = game.ACTIONS[method](args);

        if (method === "switch") {
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


exports.getCurrActivePlayer = async (req, res) => {
    const { gameId } = parseCookies(req.headers.cookie);
    if (!gameId) {
        throw new Error("Missing 'gameId' cookie");
    }

    const game = GamesManager.getGameById(gameId);

    sendJson(res, 200, { ok:true, playerId: game.currActivePlayer.playerId });
}
