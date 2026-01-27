import { Cell } from "./cell.js";


export class Renderer{
    constructor(ctx, boardSize){
        this.ctx = ctx;
        this.boardSize = boardSize;
        this.imageCache = new Map(); // cache pour ne pas avoir à reload les images
    }


    getImage(src, requestRedraw) {
        let entry = this.imageCache.get(src);
        if (entry) return entry;

        const img = new Image();
        entry = { img, loaded: false };
        this.imageCache.set(src, entry);

        // DEBUG::
        console.log(this.imageCache.get(src));

        img.onload = () => {
            entry.loaded = true;
            requestRedraw?.(); // on demande un redraw quand une image vient de charger
        };
        img.src = src;

        return entry;
    }


    /**
     * @private
     *
     * @param {Cell[][]} grid
     */
    drawGrid(grid){
        // REVIEW : It's probably useless
        if (!grid) return;

        const gridSize = grid.length;
        const cellSize = this.boardSize / gridSize;

        this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);

        grid.forEach((row, y)=>{
            row.forEach((cell, x)=>{
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


    /**
     * @private
     *
     * @param {Cell[][]} grid
     * @param {Function} requestRedraw
     */
    drawPieces(grid, requestRedraw) {
        const gridSize = grid.length;
        const cellSize = this.boardSize / gridSize;

        const angleMap = {
            N: 0,
            W: -Math.PI / 2,
            E: Math.PI / 2,
            S: Math.PI,
        };

        grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (!cell.content) return;

                const piece = cell.content;

                const { img, loaded } = this.getImage(piece.image, requestRedraw);
                if (!loaded) return; // on dessine seulement si l'image est prête

                const cx = x * cellSize + cellSize / 2;
                const cy = y * cellSize + cellSize / 2;

                this.ctx.save();
                this.ctx.translate(cx, cy);
                this.ctx.rotate(angleMap[piece.orientation] ?? 0);
                this.ctx.drawImage(img, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
                this.ctx.restore();
            });
        });
    }


    /**
     * @param {Cell[][]} grid
     * @param {Function} requestRedraw
     */
    render(grid, requestRedraw) {
        this.drawGrid(grid);
        this.drawPieces(grid, requestRedraw);
    }
}
