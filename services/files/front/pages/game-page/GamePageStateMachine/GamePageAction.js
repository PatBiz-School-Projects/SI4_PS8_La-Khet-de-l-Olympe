/**
 * @enum {typeof GamePageActionType[keyof typeof GamePageActionType]} GamePageAction
 */
export const GamePageActionType = /** @type {const} */ ({
    START_TURN: "START_TURN",
    END_TURN: "END_TURN",

    CLICKED_PIECE_IN_INVENTORY: "CLICKED_PIECE_IN_INVENTORY",
    CLICKED_PIECE_ON_BOARD: "CLICKED_PIECE_ON_BOARD",
    CLICKED_EMPTY_CELL: "CLICKED_EMPTY_CELL",
    CLICKED_ROTATE_ARROW: "CLICKED_ROTATE_ARROW",

    CANCEL: "CANCEL",
});


/**
 * @typedef {unknown} GamePageActionPayload
 */
export const GamePageActionPayload = undefined;


/**
 * @typedef {Object} GamePageAction
 *
 * @prop {GamePageActionType} type
 * @prop {GamePageActionPayload} payload
 */
export const GamePageAction = undefined;
