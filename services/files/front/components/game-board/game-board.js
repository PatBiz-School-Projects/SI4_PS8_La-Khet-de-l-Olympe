import { BoardRenderer } from "./BoardRenderer.js";
import { Cell, CellDTO } from "./Cell.js";
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
     * Places a piece on the board at the given position.
     * Updates the board states & launch a re-rendering.
     *
     * @param {Piece} piece - The piece to place
     * @param {Coord} pos - The position where to place the piece
     *
     * @returns {Promise<Object>} A promise resolving to the updated state of the board
     * @throws {Error} If the API request fails
     */
    async placePiece(piece, pos) {
        // TODO : Moving API call out of the component
        const placeResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "place",
                args: {
                    owner: piece.toDTO().owner,
                    type: piece.toDTO().type,
                    orientation: piece.toDTO().orientation,

                    x: pos.x,
                    y: pos.y,
                }
                // REVIEW : I propose the following `args`
                // args: {
                //     piece: piece.toDTO(),
                //     pos: pos,
                // }
            }),
        });

        const updatedBoardState = await placeResponse.json();
        console.log(updatedBoardState);
        const gridDTO = updatedBoardState.grid;
        for (let i = 0; i < gridDTO.length; i++) {
            this.grid[i] = [];
            for (let j = 0; j < gridDTO[0].length; j++) {
                this.grid[i][j] = Cell.fromDTO(gridDTO[i][j]);
            }
        }
        this.renderer.drawPieceAt(piece, pos);

        return updatedBoardState;
    }


    /**
     * Moves a piece on the board to the given position.
     * Updates the board states & launch a re-rendering.
     *
     * @param {Piece} piece
     * @param {Coord} from - Current position of the piece
     * @param {Coord} to - Desired new position of the piece
     *
     * @returns {Promise<Object>} A promise resolving to the updated state of the board
     * @throws An error if the API request fails
     */
    async movePiece(piece, from, to) {
        // TODO : Moving API call out of the component
        const moveResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "move",
                args: {
                    owner: piece.toDTO().owner,

                    fromX: from.x,
                    fromY: from.y,
                    toX: to.x,
                    toY: to.y,
                }
                // REVIEW : I propose the following `args`
                // args: {
                //     piece: piece.toDTO(),
                //     from: from,
                //     to: to,
                // }
            })
        });

        const updatedGameState = await moveResponse.json();
        const gridDTO = updatedGameState.grid;
        for (let i = 0; i < gridDTO.length; i++) {
            this.grid[i] = [];
            for (let j = 0; j < gridDTO[0].length; j++) {
                this.grid[i][j] = Cell.fromDTO(gridDTO[i][j]);
            }
        }
        // const pathLaser = updatedGameState.laser;

        await this.renderer.clearPieceAt(from);
        await this.renderer.drawPieceAt(piece, to);

        return updatedGameState;
    }
}
customElements.define('game-board', GameBoard);
