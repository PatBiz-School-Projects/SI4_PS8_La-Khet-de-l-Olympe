const Cell = require('./cell')
class Board {
    constructor(){
        this.grid = [];

        for(let i = 0; i < 10; i++){
            const row = []
            for(let j = 0; j < 10; j++){
                row.push(new Cell(i, j));
            }
            this.grid.push(row);
        }

        this.sphinxes={
            1:null,
            2:null
        }
    }

    getPiece(x,y){
        return this.grid[x][y].getPiece();
    }

    findAndCacheSphinxes(){
        for(let i = 0; i < 10; i++){
            for(let j = 0; j < 10; j++){
                let piece = this.getPiece(i,j)
                if(piece) {
                    if (piece.type === "Sphinx") {
                        this.sphinxes[piece.owner] = {x: i, y: j, orientation: piece.orientation};
                    }
                }
            }
        }
        console.log(this.sphinxes);
    }

    getSphinxByOwner(owner){
        return this.sphinxes[owner];
    }

    toDTO() {
        return {
            grid: this.grid.map(row =>
                row.map(cell => (
                    cell.toDTO()
                ))
            )
        };
    }

    addPiece(x,y,piece){
        this.grid[x][y].addPiece(piece)
    }

    removePiece(x,y){
        this.grid[x][y].removePiece()
    }
}
module.exports = Board;