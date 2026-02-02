const Board = require('../entities/board');
const Piece = require('../entities/piece');
const {createPieceFromDto} = require("../factory/pieceFactory");
const{fire} =require("./laserService");
const StartingPositions = require("./startingPositions");


class BoardManager {
    constructor() {
        this.board = null;
    }

    initBoard() {
        this.board = new Board();
        const sp = new StartingPositions(10);
        const result = sp.generateAndApply(this.board);

        if (!result.ok) {
            return { ok: false, detail: result.detail, error: result.error };
        }
        // TODO : Generating the initial position of the pieces*/
        return this.board.toDTO()
    }

    placePiece(pieceDto,x,y) {
        if(!this.board) return {
            ok : false,
            detail : "BOARD_NOT_INITIALIZED"
        }
        const result = createPieceFromDto(pieceDto);
        if(!result){
            return {
                ok : false,
                detail : "INVALID_ARGS"
            }
        }
        if(this.board.getPiece(x,y)){
            return {
                ok : false,
                detail : "PIECE_ALR_AT_COORDS"
            }
        }
        this.board.addPiece(x,y,result);
        return { ok: true, detail: "PIECE_PLACED", grid:this.board.toDTO() };
    }

    movePiece(fromX, fromY, toX, toY) {
        // prècédé par des middleware qui diront si le coup est légal (bon tour, bon move...)
        const piece = this.board.getPiece(fromX, fromY);
        if (!piece) return {
            ok: false,
            detail: "NO_PIECE_AT_COORDS"
        };

        this.board.removePiece(fromX,fromY);
        this.board.addPiece(toX, toY, piece);
        //fire(getCurrentPlayer());// after a move the sphinx fires the laser (not sure where to put it)
        return {
            ok : true,
            detail: "PIECE_MOVED",
            grid:this.board.grid
        }
    }

    removePiece(x,y) {
        const cell = this.board.grid[x][y];
        cell.removePiece();
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

    getBoard(){
        return {
            ok : true,
            board : this.board
        }
    }

}

module.exports = BoardManager;
