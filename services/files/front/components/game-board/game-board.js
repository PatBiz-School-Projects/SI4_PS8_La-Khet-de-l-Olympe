import { BoardRenderer } from "./BoardRenderer.js";
import { Cell } from "./Cell.js";
import { Coord } from "./Coord.js"
import { Piece } from "./Piece.js";

import { assert } from "/utils/assert.js";


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
                fetch("/components/game-board/game-board.html"),
                fetch("/components/game-board/game-board.css"),
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

        assert(this.grid.length === 10);
        this.grid.forEach(row => assert(row.length === 10));

        this.renderer.setCanvasResolution();
        // TODO ?: Uncomment the line below if one day we decide to support bigger than 10×10 grid
        // this.renderer.setBoardLen(this.grid.length);
        await this.renderer.drawEmptyGrid();
        await this.renderer.drawBoard(this.grid);
    }


    /**
     * @private
     */
    async _initializeBoard() {
        const boardResponse = await fetch("/api/game-service/board");
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


    /**
     * @param {Coord} pos
     *
     * @returns {Cell}
     */
    getCellAt(pos) {
        console.log(pos)
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

        await this.renderer.clearPieceAt(from);
        await this.renderer.drawPieceAt(piece, to);
    }

    /**
     * Places the given piece at the given position
     * & updates the board rendering.
     *
     * @param {Piece} piece - The piece to place
     * @param {Coord} pos - The position where to place the piece
     */
    async placePiece(piece, pos) {
        this.grid[pos.x][pos.y].put(piece);

        await this.renderer.drawPieceAt(piece, pos);
    }
}
customElements.define('game-board', GameBoard);
