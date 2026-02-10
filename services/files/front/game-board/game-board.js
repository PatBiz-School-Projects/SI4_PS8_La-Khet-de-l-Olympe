import { BoardRenderer } from "./BoardRenderer.js";
import { Cell, CellDTO } from "./Cell.js";
import { Coord } from "./Coord.js"
import { Piece } from "./Piece.js";


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
                fetch("game-board/game-board.html"),
                fetch("game-board/game-board.css"),
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
        // TODO : Uncomment the line below once the `/api/init-board` has been patched
        await this.renderer.drawBoard(this.grid);

        // TODO : To remove once it's not needed anymore
        //await this._runDemo();
    }


    /**
     * @private
     */
    async _initializeBoard() {
        const initResponse = await fetch("/api/game-service/init-board");
        const initialState = await initResponse.json();

        /** @type {CellDTO[][]} */
        const initialGrid = initialState.grid;

        for (let i=0; i<initialGrid.length; i++) {
            this.grid[i] = [];
            for (let j=0; j<initialGrid[0].length; j++) {
                this.grid[i][j] = Cell.fromDTO(initialGrid[i][j])
            }
        }

        // REVIEW : It might be better to move the "turn logic" out of `GameBoard`
        const turnUpdatedEvent = new CustomEvent('turn-updated', {
            detail: { player: initialState.currentPlayer },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(turnUpdatedEvent);
    }


    /**
     * @private
     *
     * Places a piece on the board at the given position.
     * Updates the board states & launch a re-rendering.
     *
     * @param {Piece} piece - The piece to place
     * @param {Coord} pos - The position where to place the piece
     *
     * @returns {Promise<Object>} A promise resolving to the updated state of the board
     * @throws {Error} If the API request fails
     */
    async _placePiece(piece, pos) {
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
     * @private
     *
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
    async _movePiece(piece, from, to) {
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
        const pathLaser = updatedGameState.laser;

        await this.renderer.drawEmptyGrid();
        await this.renderer.drawBoard(this.grid);

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

        const sphinxPiece = Piece.fromDTO({
            type: "Anubis",
            owner: 1,
            orientation: "N",
        });

        await this._placePiece(sphinxPiece, {x: 0, y: 2});
        await this._movePiece(sphinxPiece, {x: 0, y: 2}, {x: 6, y: 7});
    }
}
customElements.define('game-board', GameBoard);
