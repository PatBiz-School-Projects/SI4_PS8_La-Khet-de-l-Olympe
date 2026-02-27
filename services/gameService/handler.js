const { readJsonBody, sendJson, parseCookies } = require("./helpers/parser");

const { GamesManager } = require("./GamesManager");
const { PlayersManager } = require("./PlayersManager");


//
// HTTP
//

exports.HTTPMiddelware_OutsideGame = (handlerCb) => async (req, res) => {
    try {
        const { userId, userToken } = parseCookies(req.headers.cookie);
        if (!userId) {
            throw new Error("Missing 'userId' cookie");
        }
        if (!userToken) {
            throw new Error("Missing 'userToken' cookie");
        }

        // Add more verifications here (if needed)

    } catch (err) {
        console.error(err);
        sendJson(res, 400, {ok: false, error: err.message});
        return;
    }

    await handlerCb(req, res);
};


exports.HTTPMiddelware_InsideGame = (handlerCb) => async (req, res) => {
    try {
        const { userId, userToken, gameId } = parseCookies(req.headers.cookie);
        if (!userId) {
            throw new Error("Missing 'userId' cookie");
        }
        if (!userToken) {
            throw new Error("Missing 'userToken' cookie");
        }
        if (!gameId) {
            throw new Error("Missing 'gameId' cookie");
        }
        if (!GamesManager.runningGamesId.includes(gameId)) {
            throw new Error(`No running game with id=${gameId}`);
        }

        // Add more verifications here (if needed)

    } catch (err) {
        console.error(err);
        sendJson(res, 400, {ok: false, error: err.message});
        return;
    }

    await handlerCb(req, res);
};


exports.HTTPHandler = {
    //
    // Outside a game
    //

    newPlayer: async (req, res) => {
        const { userId, userToken } = parseCookies(req.headers.cookie);

        const playerId = PlayersManager.newPlayer(userId, userToken);

        sendJson(res, 200, { ok:true, playerId });
    },

    startSoloGame: async (req, res) => {
        let player;
        try {
            const { playerId } = await readJsonBody(req);
            player = PlayersManager.getPlayerById(playerId);
        } catch (err) {
            console.error(err)
            sendJson(res, 400, { ok: false, error: err.message });
            return;
        }

        // TODO : Complete it once the AI has been implemented
    },

    startLocalMultiplayerGame: async (req, res) => {
        let player1, player2;
        try {
            const { playerId1, playerId2 } = await readJsonBody(req);
            player1 = PlayersManager.getPlayerById(playerId1);
            player2 = PlayersManager.getPlayerById(playerId2);
        } catch (err) {
            console.error(err)
            sendJson(res, 400, { ok: false, error: err.message });
            return;
        }

        const gameId = GamesManager.newGame();
        GamesManager.registerPlayerInRoom(player1, gameId);
        GamesManager.registerPlayerInRoom(player2, gameId);

        sendJson(res, 200, { ok:true, gameId });
    },

    joinMultiplayerGame: async (req, res) => {
        let player;
        try {
            const { playerId } = await readJsonBody(req);
            player = PlayersManager.getPlayerById(playerId);
        } catch (err) {
            console.error(err)
            sendJson(res, 400, { ok: false, error: err.message });
            return;
        }

        const gameId = GamesManager.findRoomFor(player);

        sendJson(res, 200, { ok:true, gameId });
    },

    //
    // Inside a game
    //

    action: async (req, res) => {
        try {
            const { gameId } = parseCookies(req.headers.cookie);
            const game = GamesManager.getGameById(gameId);

            const action = await readJsonBody(req);
            const {actionRes, laserRes} = game.onAction(action);
            sendJson(res, 200, { ok:true, ...actionRes, ...laserRes });

            game.nextTurn();
        } catch (err) {
            console.error(err)
            sendJson(res, 400, { ok: false, error: err.message });
        }
    },

    getPiece: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        const body = await readJsonBody(req);
        const {x, y} = body;

        try {
            const piece = game.board.getPieceAt({x, y});
            sendJson(res, 200, { ok:true, ...piece.toDTO() });
        } catch (err) {
            console.error(err);
            sendJson(res, 400, { ok: false, error: err.message });
        }
    },

    getBoard: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        sendJson(res, 200, { ok:true, ...game.board.toDTO() });
    },

    getCurrActivePlayer: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        sendJson(res, 200, { ok:true, playerId: game.currActivePlayer.playerId });
    },

    getPlayerOfClient: async (req, res) => {
        const { userId, userToken, gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        let playerOfClient;
        for (const player of game.players)
            if (player.userId === userId && player.userToken == userToken) {
                if (playerOfClient) {
                    // If we already found one player corresponding to the user,
                    // which only happens if we are in a local multiplayer game,
                    // then we take the active one.
                    playerOfClient = (
                        (game.playerCanPlay(playerOfClient))
                        ? playerOfClient
                        : player
                    );
                } else {
                    playerOfClient = player;
                }
            }

        sendJson(res, 200, { ok:true, playerId: playerOfClient.playerId });
    },
};


//
// SocketIO
//


exports.SocketIOMiddelware = (socket, next) => {
    try {
        const { userId, userToken, gameId } = parseCookies(socket.handshake.headers.cookie || "");
        if (!userId) {
            throw new Error("Missing 'userId' cookie");
        }
        if (!userToken) {
            throw new Error("Missing 'userToken' cookie");
        }
        if (!gameId) {
            throw new Error("Missing 'gameId' cookie");
        }
        if (!GamesManager.runningGamesId.includes(gameId)) {
            throw new Error(`No running game with id=${gameId}`);
        }
    } catch (err) {
        console.error("Rejected socket bcs:", err);
        return next(err)
    }

    return next();
}

exports.SocketIOHandler = {
    //
    // Inside a game
    //

    onConnection: async (io, socket, msgPayload) => {
        const { userId, userToken, gameId } = parseCookies(socket.handshake.headers.cookie || "");

        const game = GamesManager.getGameById(gameId);

        game.players
            .filter(player => (
                player.userId === userId && player.userToken === userToken
            ))
            .forEach(player => {
                player.socket = socket;
            });
    },

    // Add more if needed ...

    onDisconnection: async (io, socket, msgPayload) => {},
};
