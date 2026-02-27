const { sendJson } = require("./helpers/parser");

const { HTTPHandler, SocketIOMiddelware, SocketIOHandler } = require('./handler.js');

const ROUTES = {
    //
    // Outside a game
    //

    '/api/game-service/new-player': (req, res) => {
        HTTPHandler.newPlayer(req, res);
    },
    '/api/game-service/start-solo-game': (req, res) => {
        HTTPHandler.startSoloGame(req, res);
    },
    '/api/game-service/start-local-multiplayer-game': (req, res) => {
        HTTPHandler.startLocalMultiplayerGame(req, res);
    },
    '/api/game-service/join-multiplayer-game': (req, res) => {
        HTTPHandler.joinMultiplayerGame(req, res);
    },

    //
    // Inside a game
    //

    '/api/game-service/action': (req, res) => {
        HTTPHandler.action(req, res);
    },
    '/api/game-service/board/piece': (req, res) => {
        HTTPHandler.getPiece(req, res);
    },
    '/api/game-service/board': (req, res) => {
        HTTPHandler.getBoard(req, res);
    },
    '/api/game-service/curr-player': (req, res) => {
        HTTPHandler.getCurrActivePlayer(req, res);
    },
};


exports.manage = async (req,res) => {
    const url = req.url;
    if(ROUTES[url]){
        await ROUTES[url](req, res);
    } else {
        sendJson(res, 404, {ok: false, error: 'Not Found'})
    }
}


exports.manageSocket = async (io, socket) => {
    io.use(SocketIOMiddelware);

    await SocketIOHandler.onConnection(io, socket);

    // Add more if needed ...

    socket.on("disconnect", SocketIOHandler.onDisconnection);
}