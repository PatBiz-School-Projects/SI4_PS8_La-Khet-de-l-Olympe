import { GameBoard } from "/components/index.js";

import { GamePageAction, GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";


export class GamePageClickHandler {
    constructor(dom) {
        /** @private @type {Document} */
        this.dom = dom;
    }


    /**
     * @private
     *
     * @param {PointerEvent} clickEvent
     * @param {GameBoard} board
     *
     * @returns {{x: number, y: number}}
     */
    _getClickPosOnBoard(clickEvent, board) {
        const posMod = (dividend, divisor) => (((dividend % divisor) + divisor) % divisor);

        const boardRect = board.getBoundingClientRect();

        // Note:
        // - `clientY` := the vertical position of the mouse
        // - `clientX` := the horizontal position of the mouse

        const relativeX = (clickEvent.clientY - boardRect.bottom) / boardRect.width;
        const relativeY = (clickEvent.clientX - boardRect.left) / boardRect.height;

        return {
            x: posMod(Math.floor(relativeX * board.length), board.length),
            y: posMod(Math.floor(relativeY * board.length), board.length),
        };
    }


    /**
     * @param {PointerEvent} clickEvent
     *
     * @returns {GamePageAction}
     */
    computePageAction(clickEvent) {
        /** @type {GameBoard} */
        const board = this.dom.querySelector("game-board");

        if (clickEvent.target === board) {
            const pos = this._getClickPosOnBoard(clickEvent, board);

            // DEBUG::
            console.log("Clicked on cell at:", pos);

            const selectedCell = board.getCellAt(pos);
            if (selectedCell.isEmpty()) {
                return {
                    type: GamePageActionType.CLICKED_EMPTY_CELL,
                    payload: { pos },
                };
            } else {
                return {
                    type: GamePageActionType.CLICKED_PIECE_ON_BOARD,
                    payload: { pos, piece: selectedCell.content },
                };
            }
        }

        // TODO : Supporting clicks on inventory (once an inventory component is created)

        // TODO : Supporting clicks on rotation arrows (once added to the game page)

        return { type: GamePageActionType.CANCEL };
    }
}
