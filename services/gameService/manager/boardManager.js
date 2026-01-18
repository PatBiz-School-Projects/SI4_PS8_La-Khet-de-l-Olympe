const Board = require('../entities/board');
class BoardManager {
    constructor() {
        this.board = null;
    }

    initBoard(req,res) {
        this.board = new Board();

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "success", detail: "Board initialisée", grid: this.board.grid }));

        console.log("Nouvelle partie générée sur le serveur.");
    }
}

module.exports = BoardManager;