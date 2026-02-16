import { GameBoard } from "/components/index.js";

import { GamePageAction, GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";


export class GamePageClickHandler {
    constructor(dom) {
        /** @private @type {Document} */
        this.dom = dom;
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
            const boardRect = board.getBoundingClientRect();

            const relativeX = (clickEvent.y - boardRect.top) / boardRect.height;
            const relativeY = (clickEvent.x - boardRect.left) / boardRect.width;

            const pos = {
                x: Math.floor(relativeX * gridSize),
                y: Math.floor(relativeY * gridSize),
            };

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

        // TODO : Supporting clicks on rotation arrows (once an inventory component is created)

        return { type: GamePageActionType.CANCEL };
    }
}
