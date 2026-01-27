import { Renderer } from "./renderer.js";
import { Cell, CellDTO } from "./cell.js";
import { Piece } from "./piece.js";


/**
 * @typedef {Object} Coord
 *
 * @property {number} x
 * @property {number} y
 */


class GameBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const DEFAULT_BOARD_SIZE = 600;

        /** @private @type {number} Size of the board in pixels */
        this.boardSize = DEFAULT_BOARD_SIZE;

        /** @private @type {Cell[][]} */
        this.grid = [];

        /** @private @type {HTMLCanvasElement} */
        this.canvas;

        /** @private @type {CanvasRenderingContext2D} */
        this.ctx;

        /** @private @type {Renderer} */
        this.renderer;
    }


    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("board/board.html"),
                fetch("board/board.css"),
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

        this.boardSize = this._computeBoardSize();

        this.canvas = this.shadowRoot.querySelector('#gameCanvas');
        this.canvas.width = this.boardSize;
        this.canvas.height = this.boardSize;

        this.ctx = this.canvas.getContext("2d");

        this.renderer = new Renderer(this.ctx, this.boardSize);

        try {
            await this._initializeBoard();
        } catch (err) {
            console.error("Error while initializing the board:", err)
        }

        // TODO : To remove once it's not needed anymore
        await this._runDemo();
    }


    /**
     * @private
     */
    _computeBoardSize() {
        const X_PADDING = 40;
        const Y_PADDING = 30;

        const availableWidth = window.innerWidth - X_PADDING;
        const availableHeight = window.innerHeight - Y_PADDING;

        return Math.min(availableWidth, availableHeight);
    }


    /**
     * @private
     */
    async _initializeBoard() {
        const initResponse = await fetch("/api/init-board");
        const initialState = await initResponse.json();

        /** @type {CellDTO[][]} */
        const initialGrid = initialState.grid;

        for (let i=0; i<initialGrid.length; i++) {
            this.grid[i] = [];
            for (let j=0; j<initialGrid[0].length; j++) {
                this.grid[i][j] = Cell.fromDTO(initialGrid[i][j])
            }
        }

        this.renderer.drawGrid(this.grid);

        // REVIEW : It might be better to move the "turn logic" out of `GameBoard`
        const turnUpdatedEvent = new CustomEvent('turn-updated', {
            detail: { player: initialState.currentPlayer },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(turnUpdatedEvent);
    }


    _renderBoard = () => {
        // REVIEW : It's probably useless
        if (!this.renderer || !this.grid) return;

        // DEBUG::
        console.log("Grid data:", this.grid);

        this.renderer.render(this.grid, this._renderBoard);
    };


    /**
     * @private
     *
     * Place a piece on the board at the given position.
     * Updates the board states & launch a re-rendering.
     *
     * @param {Piece} piece - The piece to place
     * @param {Coord} pos - The position where to place the piece
     *
     * @returns {Promise<Object>} A promise resolving to the updated state of the board
     * @throws {Error} If the API request fails
     */
    async _placePiece(piece, pos) {
        const placeResponse = await fetch("/api/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "place",
                args: {
                    // REVIEW : Passing `piece` is clearer
                    owner: piece.owner,
                    type: piece.type,
                    orientation: piece.orientation,

                    x: pos.x,
                    y: pos.y,
                }
            }),
        });

        const updatedBoardState = await placeResponse.json();
        this.grid = updatedBoardState.grid;
        this._renderBoard();

        return updatedBoardState;
    }


    /**
     * @private
     *
     * Move a piece on the board to the given position.
     * Updates the board states & launch a re-rendering.
     *
     * @param {Piece} piece
     * @param {Coord} from - Current position of the piece
     * @param {Coord} to - Desired new position of the piece
     *
     * @returns {Promise<Object>} A promise resolving to the updated state of the board
     * @throws An error if the API request fails
     */
    async _movePiece(piece, from, to) {
        const moveResponse = await fetch("/api/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "move",
                args: {
                    // REVIEW : Passing `piece` should be OK & is clearer
                    owner: piece.owner,

                    fromX: from.x,
                    fromY: from.y,
                    toX: to.x,
                    toY: to.y,
                }
            })
        });

        const updatedBoardState = await moveResponse.json();
        this.grid = updatedBoardState.grid;
        this._renderBoard();

        return updatedBoardState;
    }


    /**
     * @private
     *
     * Run a sequence of action for debugging purposes.
     */
    async _runDemo() {
        // Scenario:
        // 1. Place a sphinx at Coord[4, 4]
        // 2. Move the sphinx at Coord[6, 6]

        const sphinxPiece = {
            type: "Anubis",
            owner: 1,
            orientation: "N",
            image: "anubis.png",
        };

        await this._placePiece(sphinxPiece, {x: 4, y: 4});
        await this._movePiece(sphinxPiece, {x: 4, y: 4}, {x: 6, y: 6});
    }
}
customElements.define('game-board', GameBoard);
