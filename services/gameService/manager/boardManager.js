const Board = require('../entities/board');
const Piece = require('../entities/piece');
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
        if(!this.board) return {
            ok : false,
            detail : "BOARD_NOT_INITIALIZED"
        }
        const result = createPieceFromDto(piece);
        if(this.board.getPiece(result.x,result.y)){
            return {
                ok : false,
                detail : "PIECE_ALR_AT_COORDS"
            }
        }
        this.board.grid[result.x][result.y].addPiece(result);
        return { ok: true, detail: "PIECE_PLACED", grid:this.board.grid };
    }

    movePiece(fromX, fromY, toX, toY) {
        // prècédé par des middleware qui diront si le coup est légal (bon tour, bon move...)
        const piece = this.board.getPiece(fromX, fromY);
        if (!piece) return {
            ok: false,
            detail: "NO_PIECE_AT_COORDS"
        };

        this.board.grid[fromX][fromY].reset();
        this.board.grid[toX][toY].addPiece(piece);

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

    rotatePiece(x,y,turns){
        try {
            const piece = this.board.getPiece(x,y);

            if(!piece) return {
                ok : false,
                detail : "PIECE_NOT_FOUND"
            }
            const newOrientation = piece.rotate(turns);
            return {
                ok : true,
                detail : "PIECE_ROTATED",
                orientation : newOrientation
            }
        }
        catch (err) {
            return {
                ok : false,
                detail : "PIECE_NOT_ROTATABLE"
            }
        }
    }

    getPiece(x,y){
        return this.board.getPiece(x,y) ? {
            ok : true,
            piece : this.board.getPiece(x,y)
        } : {
            ok : false,
            detail : "PIECE_NOT_FOUND"
        }
    }

}

module.exports = BoardManager;