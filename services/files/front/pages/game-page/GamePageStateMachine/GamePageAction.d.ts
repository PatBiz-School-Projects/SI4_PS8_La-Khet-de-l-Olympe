import { Coord } from "/components/game-board/Coord.js";
import { Piece } from "/components/game-board/Piece.js";


export type GamePageActionType = typeof GamePageActionType[keyof typeof GamePageActionType];
export declare const GamePageActionType = {
    START_TURN: "START_TURN",
    END_TURN: "END_TURN",

    CLICKED_PIECE_IN_INVENTORY: "CLICKED_PIECE_IN_INVENTORY",
    CLICKED_PIECE_ON_BOARD: "CLICKED_PIECE_ON_BOARD",
    CLICKED_EMPTY_CELL: "CLICKED_EMPTY_CELL",
    CLICKED_ROTATE_ARROW: "CLICKED_ROTATE_ARROW",

    CANCEL: "CANCEL",
} as const;


export type GamePageActionPayload<T extends GamePageActionType> =
    T extends typeof GamePageActionType.START_TURN
        ? { playerId: number } :
    T extends typeof GamePageActionType.END_TURN
        ? undefined :
    T extends typeof GamePageActionType.CLICKED_PIECE_IN_INVENTORY
        ? { inventoryIdx: number, piece: Piece } :
    T extends typeof GamePageActionType.CLICKED_PIECE_ON_BOARD
        ? { pos: Coord, piece: Piece } :
    T extends typeof GamePageActionType.CLICKED_EMPTY_CELL
        ? { pos: Coord } :
    T extends typeof GamePageActionType.CLICKED_ROTATE_ARROW
        ? { rotation: "left"|"right" } :
    T extends typeof GamePageActionType.CANCEL
        ? undefined :
    never;


export type GamePageAction = {
    [K in GamePageActionType]: {type: K, payload: GamePageActionPayload<K>}
}[GamePageActionType];
