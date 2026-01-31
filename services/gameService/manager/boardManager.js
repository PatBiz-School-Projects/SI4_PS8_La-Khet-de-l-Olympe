const Board = require('../entities/board');
const {createPieceFromDto} = require("../factory/pieceFactory");
const {getCurrentPlayer} = require("gameState")
const{fire} =require("laserService");
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
        fire(getCurrentPlayer());// after a move the sphinx fires the laser (not sure where to put it)
        return {
            ok : true,
            detail: "PIECE_MOVED",
            grid:this.board.grid
        }
    }

    removePiece(x,y) {
        const cell = this.board.grid[y][x];
        const piece = cell.getPiece();
        if(piece.constructor.name=== "Pyramid"){
            if(piece.owner!==getCurrentPlayer()){
                //add into the box of currentPlayer
            }
        }
        cell.removePiece(piece);
        return {
            ok : true,
            detail: "PIECE_REMOVED",
            grid:this.board.grid
        };
    }

}

module.exports = BoardManager;