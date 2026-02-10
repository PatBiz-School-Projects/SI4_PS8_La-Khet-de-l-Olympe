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

    removePiece() {
        this.piece = null;
    }

    getPiece(){
        return this.piece;
    }
    toDTO(){
        return {
            x: this.x,
            y: this.y,
            piece: this.piece ? this.piece.toDTO() : null
        }
    }
}

module.exports = Cell;
