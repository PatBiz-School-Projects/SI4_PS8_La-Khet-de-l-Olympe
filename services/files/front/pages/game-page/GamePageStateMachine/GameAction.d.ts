import { Coord } from "/components/game-board/Coord.js";
import { Piece } from "/components/game-board/Piece.js";


export type GameActionType = typeof GameActionType[keyof typeof GameActionType];
export declare const GameActionType = {
    MOVE_PIECE: "MOVE_PIECE",
    PLACE_PIECE: "PLACE_PIECE",
    ROTATE_PIECE: "ROTATE_PIECE",
    SWITCH_PIECES: "SWITCH_PIECES",
} as const;


export type GameActionPayload<T extends GameActionType> =
    T extends typeof GameActionType.MOVE_PIECE
        ? { piece: Piece, from: Coord, to: Coord } :
    T extends typeof GameActionType.PLACE_PIECE
        ? { piece: Piece, pos: Coord } :
    T extends typeof GameActionType.ROTATE_PIECE
        ? { piece: Piece, pos: Coord, rotation: "left"|"right" } :
    T extends typeof GameActionType.SWITCH_PIECES
        ? { piece1: Piece, pos1: Coord, piece2: Piece, pos2: Coord } :
    never;


export type GameAction = {
    [K in GameActionType]: {type: K, payload: GameActionPayload<K>}
}[GameActionType];
