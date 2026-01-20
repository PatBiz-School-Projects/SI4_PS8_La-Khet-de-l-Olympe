const {Anubis, Pharao, Pyramid, Scarab, Sphinx} = require("../entities/piece");
const Board = require("../entities/board");


class MoveValidator {
    constructor(board){
        this.board = board;
    }

    checkMove(move){
        const piece = move.piece;
        if(move.x>10||move.y>10){
            return false;
        }
        if(this.board[move.x][move.y].piece.owner!==move.owner){
            return false;
        }
        switch(piece.type){
            case Anubis : this.checkMoveAnubis(move);
                            break;
            case Pharao : this.checkMovePharao(move);
                            break;
            case Pyramid : //TODO
            case Scarab: //TODO
            case Sphinx : //TODO
            default: {
                throw new Error('What is this piece?');
            }
        }
    }

    checkMoveAnubis(move){
        return this.checkOrthagonalMove(move);
    }

    checkMovePharao(move){
        return this.checkOrthagonalMove(move);
    }

    checkMovePyramid(move){
        const board = new Board();
        //const pyramid =
    }
    checkMoveScarab(move){
        //TODO
    }
    checkMoveSphinx(move){
        //TODO
    }

    checkOrthagonalMove(move){
        if(this.checkIfTheresPiece(move)===false) return false;
        const previousX = move.piece.x;
        const previousY = move.piece.y;

        const wantedMove = {
            x: move.x,
            y: move.y
        }

        const movesPossible = [];
        movesPossible.push(previousX+1,previousY);
        movesPossible.push(previousX-1,previousY);
        movesPossible.push(previousX,previousY+1);
        movesPossible.push(previousX,previousY-1);

        return movesPossible.contains(wantedMove);

    }

    checkIfTheresPiece(move){
        const board = new Board();
        return !board[move.x][move.y].piece;

    }
}