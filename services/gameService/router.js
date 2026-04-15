const { Router } = require("./helpers/router");
const { authenticated } = require("./helpers/middlewares");

const {
    HTTPMiddleware_OutsideGame,
    HTTPMiddleware_InsideWaitingRoom,
    HTTPMiddleware_InsideGame,
    HTTPHandler,
    SocketIOMiddleware,
    SocketIOHandler,
} = require("./handler.js");


const ROUTER = (new Router()
    //
    // Outside a game
    //

    .add("/api/game-service/new-player", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.newPlayer)),
    })
    .add("/api/game-service/start-solo-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.startSoloGame)),
    })
    .add("/api/game-service/start-local-multiplayer-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.startLocalMultiplayerGame)),
    })
    .add("/api/game-service/join-multiplayer-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.joinMultiplayerGame)),
    })
    .add("/api/game-service/open-multiplayer-room", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.openMultiplayerRoom)),
    })

    //
    // Inside a waiting room
    //

    .add("/api/game-service/game-has-started", {
        GET: authenticated(HTTPMiddleware_InsideWaitingRoom(HTTPHandler.hasGameStarted)),
    })

    //
    // Inside a game
    //

    .add("/api/game-service/action", {
        POST: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.action)),
    })
    .add("/api/game-service/board/piece?x={}&y={}", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getPieceAt)),
    })
    .add("/api/game-service/possible-actions?x={}&y={}", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getPossibleMoves)),
    })
    .add("/api/game-service/board", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getBoard)),
    })
    .add("/api/game-service/inventory", {
        POST: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getInventoryOfPlayer)),
    })
    .add("/api/game-service/players", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getPlayers)),
    })
    .add("/api/game-service/active-player", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getActivePlayer)),
    })
    .add("/api/game-service/client-player", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getClientPlayer)),
    })

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    // TODO : Fully migrates from the old routes to the new routes

    //
    // Outside a game
    //

    .add("/api/games/new-player", {
        PUT: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.newPlayer)),
    })
    .add("/api/games/start-solo-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.startSoloGame)),
    })
    .add("/api/games/start-local-multiplayer-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.startLocalMultiplayerGame)),
    })
    .add("/api/games/join-multiplayer-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.joinMultiplayerGame)),
    })
    .add("/api/games/join-private-multiplayer-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.joinPrivateMultiplayerGame)),
    })
    .add("/api/games/history/:userId", {
        GET: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.getUserHistory)),
    })

    //
    // Inside a waiting room
    //

    .add("/api/games/:gameId/has-started", {
        GET: authenticated(HTTPMiddleware_InsideWaitingRoom(HTTPHandler.hasGameStarted)),
    })

    //
    // Inside a game
    //

    .add("/api/games/:gameId/action", {
        POST: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.action)),
    })
    .add("/api/games/:gameId/board", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getBoard)),
    })
    .add("/api/games/:gameId/board/piece?x={}&y={}", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getPieceAt)),
    })
    .add("/api/games/:gameId/inventories", {
        POST: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getInventories)),
    })
    .add("/api/games/:gameId/inventories/:ownerId", {
        POST: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getInventoryOfPlayer)),
    })
    .add("/api/games/:gameId/mode", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getGameMode)),
    })
    .add("/api/games/:gameId/players", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getPlayers)),
    })
    .add("/api/games/:gameId/players/active", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getActivePlayer)),
    })
    .add("/api/games/:gameId/players/client", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getClientPlayer)),
    })
    .add("/api/games/:gameId/players/:playerId", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getPlayerById)),
    })
    .add("/api/games/:gameId/possible-actions?x={}&y={}", {
        GET: authenticated(HTTPMiddleware_InsideGame(HTTPHandler.getPossibleMoves)),
    })
);


exports.manage = async (req,res) => {
    await ROUTER.handle(req, res);
}


exports.manageSocket = async (io) => {
    io = io.use(SocketIOMiddleware);

    io.on("connection", async (socket) => {
        console.log("New socket connection");

        await SocketIOHandler.onConnection(io, socket, undefined);

        // socket.on("<event>", async (msgPayload) => {
        //     SocketIOHandler.<event handler>(io, socket, msgPayload);
        // })

        // Add more if needed ...

        socket.on("disconnect", async (msgPayload) => {
            SocketIOHandler.onDisconnection(io, socket, msgPayload);
        })
    });
}
