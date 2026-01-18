export class Renderer{
    constructor(ctx, boardSize){
        this.ctx = ctx;
        this.boardSize = boardSize;
    }

    drawGrid(data){
        const grid = data;
        if(!grid)return;

        const gridSize = grid.length;
        const cellSize = this.boardSize / gridSize;

        this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
        grid.forEach((row,y)=>{
            row.forEach((cell,x)=>{
                this.ctx.fillStyle="orange"
                this.ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
                this.ctx.strokeStyle="black";
                this.ctx.strokeRect(x*cellSize, y*cellSize, cellSize, cellSize);
            });
        });
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.boardSize, this.boardSize);
    }
}