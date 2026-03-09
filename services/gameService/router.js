const { sendJson } = require("./helpers/parser");

const {
    HTTPMiddelware_OutsideGame,
    HTTPMiddelware_InsideWaitingRoom,
    HTTPMiddelware_InsideGame,
    HTTPHandler,
    SocketIOMiddelware,
    SocketIOHandler,
} = require('./handler.js');

const ROUTES = {
    //
    // Outside a game
    //

    '/api/game-service/new-player': HTTPMiddelware_OutsideGame(
        HTTPHandler.newPlayer
    ),
    '/api/game-service/start-solo-game': HTTPMiddelware_OutsideGame(
        HTTPHandler.startSoloGame
    ),
    '/api/game-service/start-local-multiplayer-game': HTTPMiddelware_OutsideGame(
        HTTPHandler.startLocalMultiplayerGame
    ),
    '/api/game-service/join-multiplayer-game': HTTPMiddelware_OutsideGame(
        HTTPHandler.joinMultiplayerGame
    ),

    //
    // Inside a waiting room
    //

    '/api/game-service/game-has-started': HTTPMiddelware_InsideWaitingRoom(
        HTTPHandler.hasGameStarted
    ),

    //
    // Inside a game
    //

    '/api/game-service/action': HTTPMiddelware_InsideGame(
        HTTPHandler.action
    ),
    '/api/game-service/board/piece': HTTPMiddelware_InsideGame(
        HTTPHandler.getPiece
    ),
    '/api/game-service/possible-actions': HTTPMiddelware_InsideGame(
        HTTPHandler.getPossibleMoves
    ),
    '/api/game-service/board': HTTPMiddelware_InsideGame(
        HTTPHandler.getBoard
    ),
    '/api/game-service/inventory': HTTPMiddelware_InsideGame(
        HTTPHandler.getInventoryOfPlayer
    ),
    '/api/game-service/players': HTTPMiddelware_InsideGame(
        HTTPHandler.getPlayers
    ),
    '/api/game-service/active-player': HTTPMiddelware_InsideGame(
        HTTPHandler.getCurrActivePlayer
    ),
    '/api/game-service/player': HTTPMiddelware_InsideGame(
        HTTPHandler.getPlayerOfClient
    ),
};


exports.manage = async (req,res) => {
    const path = req.url.split('?')[0];
    if (ROUTES[path]) {
        await ROUTES[path](req, res);
    } else {
        sendJson(res, 404, {ok: false, error: 'Not Found'});
    }
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
