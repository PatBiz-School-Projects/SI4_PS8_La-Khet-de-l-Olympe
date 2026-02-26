const { sendJson } = require("./helpers/parser");

const handler = require('./handler.js');

const ROUTES = {
    //
    // Outside a game
    //

    '/api/game-service/start-solo-game': (req, res) => {
        handler.startSoloGame(req, res);
    },
    '/api/game-service/start-local-multiplayer-game': (req, res) => {
        handler.startLocalMultiplayerGame(req, res);
    },
    '/api/game-service/join-multiplayer-game': (req, res) => {
        handler.joinMultiplayerGame(req, res);
    },

    //
    // Inside a game
    //

    // REVIEW : The front shouldn't have the responsability to make this call
    // TODO : Remove `init-board` endpoint (in back) & call (in front)
    '/api/game-service/init-board': (req, res) => {
        handler.initBoard(req, res);
    },
    '/api/game-service/action' : (req, res) => {
        handler.action(req, res);
    },
    '/api/game-service/board/piece' : (req, res) => {
        handler.getPiece(req, res);
    },
    '/api/game-service/board' : (req, res) => {
        handler.getBoard(req, res);
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
