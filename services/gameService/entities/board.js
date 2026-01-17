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
}
module.exports = Board;