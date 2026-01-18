const Board = require('../entities/board');
class BoardManager {
    constructor() {
        this.board = null;
        this.currentPlayer = 1;
        this.gameStatus = "playing";
    }

    initBoard(req,res) {
        this.board = new Board();
        this.currentPlayer = 1;

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "success", detail: "Board initialisée", grid: this.board.grid, currentPlayer:this.currentPlayer }));

        console.log("Nouvelle partie générée sur le serveur.");
    }
}

module.exports = BoardManager;