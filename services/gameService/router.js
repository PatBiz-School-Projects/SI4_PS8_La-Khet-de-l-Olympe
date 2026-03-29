const { Router } = require("./helpers/router");

const {
    HTTPMiddelware_OutsideGame,
    HTTPMiddelware_InsideWaitingRoom,
    HTTPMiddelware_InsideGame,
    HTTPHandler,
    SocketIOMiddelware,
    SocketIOHandler,
} = require("./handler.js");


const ROUTER = (new Router()
    //
    // Outside a game
    //

    .add("/api/game-service/new-player", {
        POST: HTTPMiddelware_OutsideGame(HTTPHandler.newPlayer),
    })
    .add("/api/game-service/start-solo-game", {
        POST: HTTPMiddelware_OutsideGame(HTTPHandler.startSoloGame),
    })
    .add("/api/game-service/start-local-multiplayer-game", {
        POST: HTTPMiddelware_OutsideGame(HTTPHandler.startLocalMultiplayerGame),
    })
    .add("/api/game-service/join-multiplayer-game", {
        POST: HTTPMiddelware_OutsideGame(HTTPHandler.joinMultiplayerGame),
    })
        .add("/api/game-service/open-multiplayer-room", {
            POST: HTTPMiddelware_OutsideGame(HTTPHandler.openMultiplayerRoom),
        })

    //
    // Inside a waiting room
    //

    .add("/api/game-service/game-has-started", {
        GET: HTTPMiddelware_InsideWaitingRoom(HTTPHandler.hasGameStarted),
    })

    //
    // Inside a game
    //

    .add("/api/game-service/action", {
        POST: HTTPMiddelware_InsideGame(HTTPHandler.action),
    })
    .add("/api/game-service/board/piece?x={}&y={}", {
        GET: HTTPMiddelware_InsideGame(HTTPHandler.getPieceAt),
    })
    .add("/api/game-service/possible-actions?x={}&y={}", {
        GET: HTTPMiddelware_InsideGame(HTTPHandler.getPossibleMoves),
    })
    .add("/api/game-service/board", {
        GET: HTTPMiddelware_InsideGame(HTTPHandler.getBoard),
    })
    .add("/api/game-service/inventory", {
        POST: HTTPMiddelware_InsideGame(HTTPHandler.getInventoryOfPlayer),
    })
    .add("/api/game-service/players", {
        GET: HTTPMiddelware_InsideGame(HTTPHandler.getPlayers),
    })
    .add("/api/game-service/active-player", {
        GET: HTTPMiddelware_InsideGame(HTTPHandler.getCurrActivePlayer),
    })
    .add("/api/game-service/player", {
        GET: HTTPMiddelware_InsideGame(HTTPHandler.getPlayerOfClient),
    })
);


exports.manage = async (req,res) => {
    await ROUTER.handle(req, res);
}


exports.manageSocket = async (io) => {
    io = io.use(SocketIOMiddelware);

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
