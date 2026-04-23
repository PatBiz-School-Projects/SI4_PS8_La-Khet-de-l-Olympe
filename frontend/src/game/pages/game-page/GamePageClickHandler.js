import { GameBoard, GamePlayerInventory } from "/game/components/index.js";

import { GamePageAction, GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";

import { Coord } from "/game/logic/board/Coord.js"
import {IS_MOBILE_WEBVIEW} from "/env.js";


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
     * @returns {Coord}
     */
    _getCoordOnBoardFromClick(clickEvent, board) {
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
     * @private
     *
     * @param {PointerEvent} clickEvent
     * @param {GamePlayerInventory} inventory
     *
     * @returns {number}
     */
    _getInventorySlotIdxFromClick(clickEvent, inventory) {
        const inventoryRect = inventory.getBoundingClientRect();

        const relativeX = (clickEvent.clientX - inventoryRect.left) / inventoryRect.width;
        const relativeY = (clickEvent.clientY - inventoryRect.top)  / inventoryRect.height;

        const SLOTS_ROW_LEN = 5;
        const SLOTS_COL_LEN = 3;

        const col = Math.floor(relativeX * SLOTS_ROW_LEN);
        const row = Math.floor(relativeY * SLOTS_COL_LEN);

        return row * SLOTS_ROW_LEN + col;
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
            const pos = this._getCoordOnBoardFromClick(clickEvent, board);

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

        const inventory1 = this.dom.querySelector("#player1-inventory");
        const inventory2 = this.dom.querySelector("#player2-inventory");

        if (!IS_MOBILE_WEBVIEW && (clickEvent.target === inventory1 || clickEvent.target === inventory2)) {
            /** @type {GamePlayerInventory} */
            let inventory;
            if (clickEvent.target === inventory1) {
                inventory = inventory1;
            } else {
                inventory = inventory2;
            }
            const slotIdx = this._getInventorySlotIdxFromClick(clickEvent, inventory);

            // DEBUG::
            console.log("Clicked on inventory slot:", slotIdx);

            if (inventory.hasPyramidAt(slotIdx)) {
                return {
                    type: GamePageActionType.CLICKED_PIECE_IN_INVENTORY,
                    payload: { slotIdx, piece: inventory.getPyramidAt(slotIdx) },
                };
            } else {
                return { type: GamePageActionType.CANCEL };
            }
        }

        // TODO : Supporting clicks on rotation arrows (once added to the game page)

        return { type: GamePageActionType.CANCEL };
    }
}
