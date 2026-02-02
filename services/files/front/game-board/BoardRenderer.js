import { Cell } from "./Cell.js";
import { Coord } from "./Coord.js"
import { Piece } from "./Piece.js";


export class BoardRenderer {
    /**
     * @param {HTMLDivElement} boardDiv
     */
    constructor(boardDiv) {
        const DEFAULT_BOARD_LEN = 10;

        /** @private @type {HTMLDivElement} */
        this.boardDiv = boardDiv;

        /** @private @type {Record<string, HTMLCanvasElement>} */
        this.canvases = {
            "grid-canvas": boardDiv.querySelector("#grid-canvas"),
            "visualisation-canvas": boardDiv.querySelector("#visualisation-canvas"),
            "laser-canvas": boardDiv.querySelector("#laser-canvas"),
            "pieces-canvas": boardDiv.querySelector("#pieces-canvas"),
        };

        /** @private @type {number} */
        this.boardLen = DEFAULT_BOARD_LEN;

        /** @private @type {Record<string, HTMLImageElement>} */
        this.imageCache = {};
    }

    /** @private @type {number} */
    get boardSize() {
        // NOTE : `boardSize` is a property to make the renderer responsive to any window resizing
        return parseFloat(getComputedStyle(this.boardDiv).width);
    }

    /** @private @type {number} */
    get cellSize() {
        // NOTE : `cellSize` is a property bcs `boardSize` is one
        return this.boardSize / this.boardLen;
    }


    /**
     * @param {number} boardLen - Number of columns
     *
     * Useful if one day we decide to support bigger board
     */
    setBoardLen(boardLen) {
        this.boardLen = boardLen;
    }


    /**
     * Set the canvas resolution to match the board size
     * NOTE : Must be called after the board div has been rendered and has a computed size.
     */
    setCanvasResolution() {
        const size = this.boardSize;

        Object.values(this.canvases).forEach(canvas => {
            canvas.width = size;
            canvas.height = size;
        });
    }


    /**
     * @private
     *
     * @param {string} src
     *
     * @returns {Promise<HTMLImageElement>}
     */
    async _getImage(src) {
        let img = this.imageCache[src];
        if (img !== undefined) return img;

        img = new Image();
        this.imageCache[src]= img;

        return new Promise((resolve, reject) => {
            img.onload = () => {
                resolve(img);
            };

            img.onerror = (error) => {
                // Remove failed entry from cache
                delete this.imageCache[src];
                reject(new Error(`Failed to load image: ${src}`));
            };

            img.src = src;
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    // #grid-canvas
    ////////////////////////////////////////////////////////////////////////////

    async clearGridCanvas() {
        const gridCanvas = this.canvases["grid-canvas"];
        const ctx = gridCanvas.getContext("2d");

        ctx.clearRect(0, 0, this.boardSize, this.boardSize);
    }

    /**
     * @param {Coord} pos
     */
    async drawEmptyCellAt(pos) {
        const gridCanvas = this.canvases["grid-canvas"];
        const ctx = gridCanvas.getContext("2d");

        ctx.fillStyle = "orange";
        ctx.fillRect(
            pos.x * this.cellSize,
            pos.y * this.cellSize,
            this.cellSize,
            this.cellSize
        );

        ctx.strokeStyle = "black";
        ctx.strokeRect(
            pos.x * this.cellSize,
            pos.y * this.cellSize,
            this.cellSize,
            this.cellSize
        );
    }

    async drawEmptyGrid() {
        await this.clearBoard()

        for (let x = 0; x < this.boardLen; x++) {
            for (let y = 0; y < this.boardLen; y++) {
                await this.drawEmptyCellAt({x, y});
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////
    // #laser-canvas
    ////////////////////////////////////////////////////////////////////////////

    async clearLaserCanvas() {
        const laserCanvas = this.canvases["laser-canvas"];
        const ctx = laserCanvas.getContext("2d");

        ctx.clearRect(0, 0, this.boardSize, this.boardSize);
    }

    /**
     * @param {Coord[]} coverage
     */
    async drawLaser(coverage) {
        const laserCanvas = this.canvases["laser-canvas"];
        const ctx = laserCanvas.getContext("2d");

        // TODO : ...
    }


    ////////////////////////////////////////////////////////////////////////////
    // #visualisation-canvas
    ////////////////////////////////////////////////////////////////////////////

    async clearVisualisationCanvas() {
        const visualisationCanvas = this.canvases["visualisation-canvas"];
        const ctx = visualisationCanvas.getContext("2d");

        ctx.clearRect(0, 0, this.boardSize, this.boardSize);
    }

    /**
     * @param {Coord[]} coverage
     */
    async drawVisualisation(coverage) {
        const visualisationCanvas = this.canvases["visualisation-canvas"];
        const ctx = visualisationCanvas.getContext("2d");

        // TODO : ...
    }


    ////////////////////////////////////////////////////////////////////////////
    // #pieces-canvas
    ////////////////////////////////////////////////////////////////////////////

    async clearPiecesCanvas() {
        const piecesCanvas = this.canvases["pieces-canvas"];
        const ctx = piecesCanvas.getContext("2d");

        ctx.clearRect(0, 0, this.boardSize, this.boardSize);
    }

    /**
     * @param {Piece} piece
     * @param {Coord} pos
     */
    async clearPieceAt(pos) {
        const piecesCanvas = this.canvases["pieces-canvas"];
        const ctx = piecesCanvas.getContext("2d");

        ctx.clearRect(pos.x, pos.y, this.cellSize, this.cellSize);
    }

    /**
     * @param {Piece} piece
     * @param {Coord} pos
     */
    async drawPieceAt(piece, pos) {
        const piecesCanvas = this.canvases["pieces-canvas"];
        const ctx = piecesCanvas.getContext("2d");

        const angleMap = {
            N: 0,
            W: -Math.PI / 2,
            E: Math.PI / 2,
            S: Math.PI,
        };

        const img = await this._getImage(piece.image);

        const cx = pos.x * this.cellSize + this.cellSize / 2;
        const cy = pos.y * this.cellSize + this.cellSize / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleMap[piece.orientation] ?? 0);
        ctx.drawImage(img, -this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);
        ctx.restore();
    }


    ////////////////////////////////////////////////////////////////////////////
    // #board
    ////////////////////////////////////////////////////////////////////////////

    async clearBoard() {
        await this.clearGridCanvas();
        await this.clearLaserCanvas();
        await this.clearVisualisationCanvas();
        await this.clearPiecesCanvas();
    }

    /**
     * @param {Cell[][]} grid
     */
    async drawBoard(grid) {
        await this.clearBoard()

        for (let x = 0; x < this.boardLen; x++) {
            for (let y = 0; y < this.boardLen; y++) {
                const cell = grid[x][y];

                await this.drawEmptyCellAt(cell.pos);

                if (cell.content) {
                    await this.drawPieceAt(cell.content, cell.pos);
                }
            }
        }
    }
}
