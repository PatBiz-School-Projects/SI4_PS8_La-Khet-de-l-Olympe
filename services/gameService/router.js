const { sendJson } = require("./helpers/parser");

const {
    HTTPMiddelware_OutsideGame,
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
    // Inside a game
    //

    '/api/game-service/action': HTTPMiddelware_InsideGame(
        HTTPHandler.action
    ),
    '/api/game-service/board/piece': HTTPMiddelware_InsideGame(
        HTTPHandler.getPiece
    ),
    '/api/game-service/board': HTTPMiddelware_InsideGame(
        HTTPHandler.getBoard
    ),
    '/api/game-service/active-player': HTTPMiddelware_InsideGame(
        HTTPHandler.getCurrActivePlayer
    ),
    '/api/game-service/player': HTTPMiddelware_InsideGame(
        HTTPHandler.getPlayerOfClient
    ),
};


exports.manage = async (req,res) => {
    const url = req.url;
    if(ROUTES[url]){
        await ROUTES[url](req, res);
    } else {
        sendJson(res, 404, {ok: false, error: 'Not Found'})
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