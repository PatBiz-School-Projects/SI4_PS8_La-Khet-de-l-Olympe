const { readJsonBody, sendJson, parseCookies } = require("./helpers/parser");

const { GamesManager } = require("./GamesManager");
const { GameMode } = require("./manager/game");
const { PlayersManager } = require("./PlayersManager");

const { RandomAI } = require("./ai/ai");


const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;


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


exports.HTTPMiddelware_InsideWaitingRoom = (handlerCb) => async (req, res) => {
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
        if (!GamesManager.waitingRoomsId.includes(gameId) && !GamesManager.runningGamesId.includes(gameId)) {
            throw new Error(`No waiting room nor game with id=${gameId}`);
        }

        // Add more verifications here (if needed)

    } catch (err) {
        console.error(err);
        sendJson(res, 400, {ok: false, error: err.message});
        return;
    }

    await handlerCb(req, res);
}


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

        let userProfile;
        {
            let userMinimalProfile;
            try {
                const response = await fetch(`${USERS_SERVICE_URL}/api/users/${userId}/minimal-profile`);
                userMinimalProfile = await response.json();
            } catch (err) {
                console.error(err);
                sendJson(res, 500, { ok: false, error: err.message });
                return;
            }

            let userLiveStats;
            try {
                const response = await fetch(`${USERS_SERVICE_URL}/api/users/${userId}/live-stats`);
                userLiveStats = await response.json();
            } catch (err) {
                console.error(err);
                sendJson(res, 500, { ok: false, error: err.message });
                return;
            }

            userProfile = {...userMinimalProfile, ...userLiveStats};
        }

        const player = PlayersManager.newPlayer(userId, userToken, userProfile);
        sendJson(res, 200, { ok: true, playerId: player.playerId });
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

        // TODO : Using a better AI than a random one
        const bot = PlayersManager.newBot(RandomAI);

        const gameId = GamesManager.newGame(GameMode.SOLO);
        GamesManager.registerPlayerInRoom(player, gameId);
        GamesManager.registerPlayerInRoom(bot, gameId);

        sendJson(res, 200, { ok: true, gameId });
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

        const gameId = GamesManager.newGame(GameMode.LOCAL_MULTIPLAYER);
        GamesManager.registerPlayerInRoom(player1, gameId);
        GamesManager.registerPlayerInRoom(player2, gameId);

        sendJson(res, 200, { ok: true, gameId });
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

        sendJson(res, 200, { ok: true, gameId });
    },

    //
    // Inside a waiting room
    //

    hasGameStarted: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);

        sendJson(res, 200, { ok: true, hasStarted: GamesManager.runningGamesId.includes(gameId) });
    },

    //
    // Inside a game
    //

    action: async (req, res) => {
        try {
            const { gameId } = parseCookies(req.headers.cookie);
            const game = GamesManager.getGameById(gameId);

            const action = await readJsonBody(req);
            const actionResult = game.onAction(action);
            sendJson(res, 200, { ok: true, result: actionResult });

            if (!game.isFinished()) {
                game.nextTurn();
            }

            if (game.isFinished()) {
                game.onGameOver();
            }
        } catch (err) {
            console.error(err)
            sendJson(res, 400, { ok: false, error: err.message });
        }
    },

    getPieceAt: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);
        const {x, y} = {x: parseInt(req.queryParams.x), y: parseInt(req.queryParams.y)};
        if (isNaN(x) || isNaN(y)) {
            const err = "Missing or wrong query parameters 'x' & 'y'";
            console.error(err);
            sendJson(res, 400, { ok: false, error: err });
        }

        const game = GamesManager.getGameById(gameId);

        try {
            const piece = game.board.getPieceAt({x, y});
            sendJson(res, 200, { ok: true, ...piece.toDTO() });
        } catch (err) {
            console.error(err);
            sendJson(res, 400, { ok: false, error: err.message });
        }
    },

    getBoard: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        sendJson(res, 200, { ok: true, ...game.board.toDTO() });
    },

    getPossibleMoves: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);
        const {x, y} = {x: parseInt(req.queryParams.x), y: parseInt(req.queryParams.y)};
        if (isNaN(x) || isNaN(y)) {
            const err = "Missing or wrong query parameters 'x' & 'y'";
            console.error(err);
            sendJson(res, 400, { ok: false, error: err });
        }

        const game = GamesManager.getGameById(gameId);

        try {
            const possibleMoves = game.getPossibleMoveForPiece({x, y});
            sendJson(res, 200, { ok: true, ...possibleMoves });
        } catch (err) {
            sendJson(res, 400, { ok: false, error: err.message });
        }
    },

    getInventoryOfPlayer: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);
        const { playerId } = await readJsonBody(req);

        const game = GamesManager.getGameById(gameId);

        try {
            const inventory = game.getInventoryOfPlayer(playerId);
            sendJson(res, 200, { ok: true, inventory:inventory.toDTO() });
        } catch (err) {
            console.error(err);
            sendJson(res, 400, { ok:false, error: err.message });
        }
    },

    getPlayers: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        sendJson(res, 200, { ok: true, playersId: game.players.map(player => player.playerId) });
    },

    getCurrActivePlayer: async (req, res) => {
        const { gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        sendJson(res, 200, { ok: true, playerId: game.currActivePlayer.playerId });
    },

    getPlayerOfClient: async (req, res) => {
        const { userId, userToken, gameId } = parseCookies(req.headers.cookie);

        const game = GamesManager.getGameById(gameId);

        let playerOfClient;
        for (const player of game.players)
            if (player.userId === userId && player.userToken === userToken) {
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

        sendJson(res, 200, { ok: true, playerId: playerOfClient.playerId });
    },
};


//
// SocketIO
//


exports.SocketIOMiddelware = (socket, next) => {
    try {
        const { userId, userToken, gameId } = parseCookies(socket.handshake.headers.cookie || "");
        const inWaitingRoom = (socket.handshake.query?.inWaitingRoom === "true");

        if (!userId) {
            throw new Error("Missing 'userId' cookie");
        }
        if (!userToken) {
            throw new Error("Missing 'userToken' cookie");
        }
        if (!gameId) {
            throw new Error("Missing 'gameId' cookie");
        }
        if (inWaitingRoom) {
            if (!GamesManager.waitingRoomsId.includes(gameId)) {
                throw new Error(`No waiting room with id=${gameId}`);
            }
        } else {
            if (!GamesManager.runningGamesId.includes(gameId)) {
                throw new Error(`No running game with id=${gameId}`);
            }
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
        const inWaitingRoom = (socket.handshake.query?.inWaitingRoom === "true");

        const game = (
            (inWaitingRoom)
            ? GamesManager.getWaitingRoomById(gameId)
            : GamesManager.getGameById(gameId)
        );

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
