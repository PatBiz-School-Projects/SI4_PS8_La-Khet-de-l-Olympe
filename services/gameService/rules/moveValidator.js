const {Anubis, Pyramid, Scarab} = require("../entities/piece");


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
            case Pyramid : this.checkMovePyramid(move);
                            break;
            case Scarab: this.checkMoveScarab(move);
                            break;
            default: {
                throw new Error('This piece cannot move');
            }
        }
    }

    checkMoveAnubis(move){
        return this.checkOrthogonalMove(move);
    }

    checkMovePyramid(move){
        const pyramid = move.piece;
        if(!pyramid.isFromReserve){
            return this.checkOrthogonalMove(move);
        }
        else {
            return this.checkOrthogonalPieces(move);
        }
    }
    checkMoveScarab(move){
        if(this.checkOrthogonalMove(move))return true;
        else return this.checkSwapPosition(move);
    }

    checkOrthogonalMove(move){
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
        const piece = this.board.getPiece(move.x,move.y);
        if(move.piece.type!=="Scarab")return !piece;
        else{
            return (piece.type === "Sphinx" || piece.type === "Pharaoh") && piece.owner === move.owner;
        }

    }

    checkOrthogonalPieces(move){
        if(this.checkIfTheresPiece(move)===false) return false;
        const previousX = move.x;
        const previousY = move.y;

        const directions = [
            { x: previousX + 1, y: previousY },
            { x: previousX - 1, y: previousY },
            { x: previousX, y: previousY + 1 },
            { x: previousX, y: previousY - 1 }
        ];

        for(let d in directions){
            const piece = this.board.getPiece(d.x,d.y);
            if(piece.type==="Pharaoh" && piece.owner === move.piece.owner){
                return false
            }
            if(piece.type==="Sphinx"){
                return false;
            }

        }
        return true;
    }

    checkSwapPosition(move){
        const piece = move.piece;
        if(piece.owner===this.board[move.x][move.y].piece.owner){
            if(piece.type==="Sphinx" || piece.type==="Pharaoh"){
                return true;
            }
        }
        return false;
    }
}