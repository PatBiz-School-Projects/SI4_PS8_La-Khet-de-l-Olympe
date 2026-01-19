const {Anubis, Pharao, Pyramid, Scarab, Sphinx} = require("../entities/piece");

class Referee{
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
        switch(piece){
            case Anubis : //TODO
            case Pharao : //TODO
            case Pyramid : //TODO
            case Scarab: //TODO
            case Sphinx : //TODO
            default: {
                throw new Error('What is this piece?');
            }
        }
    }

    checkMoveAnubis(move){
        //TODO
    }

    checkMovePharao(move){
        //TODO
    }

    checkMovePyramid(move){
        //TODO
    }
    checkMoveScarab(move){
        //TODO
    }
    checkMoveSphinx(move){
        //TODO
    }
}