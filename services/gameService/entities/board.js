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
    }

    getPiece(x,y){
        return this.grid[x][y].getPiece();
    }

    toDTO() {
        return {
            grid: this.grid.map(row =>
                row.map(cell => ({
                    x: cell.x,
                    y: cell.y,
                    piece: cell.piece ? {
                        owner: cell.piece.owner,
                        orientation: cell.piece.orientation,
                        image: cell.piece.image,
                        type: cell.piece.constructor.name,
                    } : null
                }))
            )
        };
    }
}
module.exports = Board;