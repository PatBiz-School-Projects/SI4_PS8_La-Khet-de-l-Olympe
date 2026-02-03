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
                let piece = this.grid.getPiece(i,j)
                if(piece.constructor.name==="Sphinx"){

                }
            }
        }
    }

    getSphinxByOwner(owner){
        //TODO
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