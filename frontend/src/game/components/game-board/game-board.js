import { BoardRenderer } from "./BoardRenderer.js";
import { Cell } from "/game/logic/board/Cell.js";
import { Coord } from "/game/logic/board/Coord.js"
import { Piece } from "/game/logic/board/Piece.js";


const GAME_ID = localStorage.getItem("gameId");


export class GameBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        /** @private @type {Cell[][]} */
        this.grid = [];

        /** @private @type {BoardRenderer} */
        this.renderer;
    }


    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("/game/components/game-board/game-board.html"),
                fetch("/game/components/game-board/game-board.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;
        } catch (err) {
            console.error("Error while loading the component:", err)
        }

        /** @type {HTMLDivElement} */
        const boardDiv = this.shadowRoot.querySelector('#board');
        this.renderer = new BoardRenderer(boardDiv);

        try {
            await this._initializeBoard();
        } catch (err) {
            console.error("Error while initializing the board:", err)
        }

        this.renderer.setCanvasResolution();
        // TODO ?: Uncomment the line below if one day we decide to support bigger than 10×10 grid
        // this.renderer.setBoardLen(this.grid.length);
        await this.renderer.drawEmptyGrid();
        await this.renderer.drawBoard(this.grid);

        // DEBUG::
        console.log("Rendered the whole grid.\nDoes it match the following grid ?\n" + this.gridRepr);
    }


    /**
     * @private
     */
    async _initializeBoard() {
        const boardResponse = await fetch(`/api/games/${GAME_ID}/board`);
        const { grid } = await boardResponse.json();

        for (let i=0; i<grid.length; i++) {
            this.grid[i] = [];
            for (let j=0; j<grid[0].length; j++) {
                this.grid[i][j] = Cell.fromDTO(grid[i][j])
            }
        }
    }

    /** @type {number} */
    get length() {
        return this.grid.length;
    }


    /** @type {string} */
    get gridRepr() { // DEBUG : Only for debug purposes
        let ret = "";
        for (const row of this.grid) {
            ret += "|";
            for (const cell of row) {
                const piece = cell.content;
                if (piece) {
                    ret += piece.type[0];
                    if (piece.color === "blue") {
                        ret += '1';
                    } else {
                        ret += '2';
                    }
                } else {
                    ret += "  ";
                }
                ret += "|"
            }
            ret += "\n";
        }

        return ret;
    }


    /**
     * @param {Coord} pos
     *
     * @returns {Cell}
     */
    getCellAt(pos) {
        return this.grid[pos.x][pos.y];
    }

    /**
     * @param {Coord} pos
     *
     * @returns {boolean}
     */
    hasPieceAt(pos) {
        return !this.grid[pos.x][pos.y].isEmpty();
    }

    /**
     * @param {Coord} pos
     *
     * @returns {Piece}
     * @throws When there is no piece at the given position
     */
    getPieceAt(pos) {
        const piece = this.grid[pos.x][pos.y].content;
        if (!piece) {
            throw new Error(`No piece at {x:${pos.x}, y:${pos.y}}`);
        }

        return piece;
    }


    /**
     * Moves the given piece to the given position
     * & updates the board rendering.
     *
     * @param {Piece} piece - The piece to move
     * @param {Coord} from - Current position of the piece
     * @param {Coord} to - Desired new position of the piece
     */
    async movePiece(piece, from, to) {
        this.getCellAt(from).empty();
        this.getCellAt(to).put(piece);

        // TODO : Uncomment once `BoardRenderer::_convCoordToCanvasCoord` is fixed
        // await this.renderer.clearPieceAt(from);
        // await this.renderer.drawPieceAt(piece, to);

        // NOTE : Temporary solution
        await this.renderer.drawBoard(this.grid);

        // DEBUG::
        console.log("Rendered the whole grid.\nDoes it match the following grid ?\n" + this.gridRepr);
    }


    /**
     * Places the given piece at the given position
     * & updates the board rendering.
     *
     * @param {Piece} piece - The piece to place
     * @param {Coord} pos - The position where to place the piece
     */
    async placePiece(piece, pos) {
        this.getCellAt(pos).put(piece);

        // TODO : Uncomment once `BoardRenderer::_convCoordToCanvasCoord` is fixed
        // await this.renderer.drawPieceAt(piece, pos);

        // NOTE : Temporary solution
        await this.renderer.drawBoard(this.grid);

        // DEBUG::
        console.log("Rendered the whole grid.\nDoes it match the following grid ?\n" + this.gridRepr);
    }



    /**
     * Apply the given rotation to the given piece at the given position
     * & updates the board rendering.
     *
     * @param {Piece} piece - The piece to rotate
     * @param {Coord} pos - The position where the piece is
     * @param {"left"|"right"} rotation - The rotation to apply
     */
    async rotatePiece(piece, pos, rotation) {
        piece.rotate(rotation);

        // TODO : Uncomment once `BoardRenderer::_convCoordToCanvasCoord` is fixed
        // await this.renderer.clearPieceAt(pos);
        // await this.renderer.drawPieceAt(piece, pos);

        // NOTE : Temporary solution
        await this.renderer.drawBoard(this.grid);
    }


    /**
     * Swap the given pieces at the given positions
     * & updates the board rendering.
     *
     * @param {Piece} piece1 - The 1st piece to swap
     * @param {Coord} pos1 - The position of the 1st piece
     * @param {Piece} piece2 - The 2nd piece to swap
     * @param {Coord} pos2 - The position of the 2nd piece
     */
    async switchPieces(piece1, pos1, piece2, pos2) {
        this.getCellAt(pos1).empty();
        this.getCellAt(pos2).empty();
        this.getCellAt(pos2).put(piece1);
        this.getCellAt(pos1).put(piece2);

        // TODO : Uncomment once `BoardRenderer::_convCoordToCanvasCoord` is fixed
        // await this.renderer.clearPieceAt(pos1);
        // await this.renderer.clearPieceAt(pos2);
        // await this.renderer.drawPieceAt(piece1, pos2);
        // await this.renderer.drawPieceAt(piece2, pos1);

        // NOTE : Temporary solution
        await this.renderer.drawBoard(this.grid);
    }


    async showLaserBeam(laserPath) {
        await this.renderer.drawLaser(laserPath);
        const delay = ms => new Promise(res => setTimeout(res, ms));
        await delay(2000);
        await this.renderer.clearLaserCanvas();
    }


    async showVisualisationMoves(actions) {
        console.log(actions);
        await this.renderer.drawVisualisation(actions);
    }


    /**
     * Synchronise la grille locale avec l'état du serveur (post-laser).
     * @param {Object[][]} gridDTO - La grille brute renvoyée par le serveur.
     */
    async syncGrid(gridDTO) {
        if (!gridDTO) return;

        this.grid = gridDTO.map(row =>
            row.map(cellDTO => Cell.fromDTO(cellDTO))
        );
        await this.renderer.drawBoard(this.grid);
    }
}
customElements.define('game-board', GameBoard);
