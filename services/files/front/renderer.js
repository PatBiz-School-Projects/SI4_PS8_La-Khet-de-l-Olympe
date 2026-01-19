export class Renderer{
    constructor(ctx, boardSize){
        this.ctx = ctx;
        this.boardSize = boardSize;
        this.imageCache = new Map();
    }

    getImage(src, requestRedraw) { // cache pour ne pas avoir à trop reload les images
        let entry = this.imageCache.get(src);
        if (entry) return entry;

        const img = new Image();
        entry = { img, loaded: false };
        this.imageCache.set(src, entry);

        img.onload = () => {
            entry.loaded = true;
            requestRedraw?.(); // on demande un redraw quand une image vient de charger
        };
        img.src = src;

        return entry;
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

    drawPieces(grid, requestRedraw) {
        const gridSize = grid.length;
        const cellSize = this.boardSize / gridSize;

        const angleMap = { N: 0, E: Math.PI / 2, S: Math.PI, W: -Math.PI / 2 };

        grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (!cell.piece) return;

                const src = `/assets/${cell.piece.image}`;
                const { img, loaded } = this.getImage(src, requestRedraw);
                if (!loaded) return; // on dessine seulement si l'image est prête

                const cx = x * cellSize + cellSize / 2;
                const cy = y * cellSize + cellSize / 2;

                this.ctx.save();
                this.ctx.translate(cx, cy);
                this.ctx.rotate(angleMap[cell.piece.orientation] ?? 0);
                this.ctx.drawImage(img, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
                this.ctx.restore();
            });
        });
    }

    render(data, requestRedraw) {
        this.drawGrid(data);
        this.drawPieces(data, requestRedraw);
    }


}