const { Router } = require("./helpers/router");
const { public, authenticated, dispatch_GuestORAuthenticated } = require("./helpers/middlewares");

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

    .add("/api/games/new-player", {
        POST: dispatch_GuestORAuthenticated(
            public(HTTPMiddleware_OutsideGame(HTTPHandler.newGuestPlayer)),
            authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.newPlayer)),
        ),
    })
    .add("/api/games/start-solo-game", {
        POST: dispatch_GuestORAuthenticated(
            public(HTTPMiddleware_OutsideGame(HTTPHandler.startSoloGame)),
            authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.startSoloGame)),
        ),
    })
    .add("/api/games/start-local-multiplayer-game", {
        POST: dispatch_GuestORAuthenticated(
            public(HTTPMiddleware_OutsideGame(HTTPHandler.startLocalMultiplayerGame)),
            authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.startLocalMultiplayerGame)),
        )
    })
    .add("/api/games/join-multiplayer-game", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.joinMultiplayerGame)),
    })

    .add("/api/games/open-multiplayer-room", {
        POST: authenticated(HTTPMiddleware_OutsideGame(HTTPHandler.openMultiplayerRoom)),
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
        GET: HTTPMiddleware_InsideWaitingRoom(HTTPHandler.hasGameStarted),
    })

    //
    // Inside a game
    //

    .add("/api/games/:gameId/action", {
        POST: HTTPMiddleware_InsideGame(HTTPHandler.action),
    })
    .add("/api/games/:gameId/forfeit", {
        POST: HTTPMiddleware_InsideGame(HTTPHandler.forfeit),
    })
    .add("/api/games/:gameId/board", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getBoard),
    })
    .add("/api/games/:gameId/board/piece?x={}&y={}", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getPieceAt),
    })
    .add("/api/games/:gameId/inventories", {
        POST: HTTPMiddleware_InsideGame(HTTPHandler.getInventories),
    })
    .add("/api/games/:gameId/inventories/:ownerId", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getInventoryOfPlayer),
    })
    .add("/api/games/:gameId/mode", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getGameMode),
    })
    .add("/api/games/:gameId/players", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getPlayers),
    })
    .add("/api/games/:gameId/players/active", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getActivePlayer),
    })
    .add("/api/games/:gameId/players/client", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getClientPlayer),
    })
    .add("/api/games/:gameId/players/:playerId", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getPlayerById),
    })
    .add("/api/games/:gameId/possible-actions?x={}&y={}", {
        GET: HTTPMiddleware_InsideGame(HTTPHandler.getPossibleMoves),
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
