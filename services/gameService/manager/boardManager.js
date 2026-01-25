const Board = require('../entities/board');
const Piece = require('../entities/piece');
const {createPieceFromDto} = require("../factory/pieceFactory");
class BoardManager {
    constructor() {
        this.board = null;
    }

    initBoard() {
        this.board = new Board();
        this.currentPlayer = 1;
        console.log("Nouvelle partie générée sur le serveur.");
        return {
            board: this.board,
            currentPlayer: 1
        }
    }

    placePiece(piece) {
        if(this.board===null) return;
        console.log(piece);
        const result = createPieceFromDto(piece);
        console.log(result);
        this.board.grid[result.y][result.x].addPiece(result);
        return { ok: true, detail: "PIECE_PLACED", grid:this.board.grid };
    }

    movePiece(fromX, fromY, toX, toY) {
        // prècédé par des middleware qui diront si le coup est légal (bon tour, bon move...)
        const piece = this.board.grid[fromY][fromX].piece;
        if (!piece) return false;

        this.board.grid[fromY][fromX].reset();
        this.board.grid[toY][toX].addPiece(piece);

        piece.move(toX, toY);
        return {
            ok : true,
            detail: "PIECE_MOVED",
            grid:this.board.grid
        }
    }

}

module.exports = BoardManager;