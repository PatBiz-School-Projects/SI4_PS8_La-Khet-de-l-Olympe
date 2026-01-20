class Cell {

    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.piece = null
    }
    get isAvailable(){
        return this.piece === null;
    }

    addPiece(piece) {
        this.piece = piece;
    }

    getPiece(){
        return this.piece;
    }

    reset(){
        this.piece = null;
    }
}

module.exports = Cell;
