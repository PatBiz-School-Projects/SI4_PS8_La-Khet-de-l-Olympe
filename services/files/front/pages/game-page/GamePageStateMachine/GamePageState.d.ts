import { Coord } from "/components/game-board/Coord.js";
import { Piece } from "/components/game-board/Piece.js";


export type GamePageStatePayload<T extends GamePageState.Substate> =
    T extends typeof GamePageState.Substate.IDLE
        ? undefined :
    T extends typeof GamePageState.Substate.SELECTED_PIECE_IN_INVENTORY
        ? { slotIdx: number, piece: Piece} :
    T extends typeof GamePageState.Substate.SELECTED_PIECE_ON_BOARD
        ? {pos: Coord, piece: Piece } :
    never;


export declare const GamePageState = {
    Superstate: {
        SPECTATING: "SPECTATING",
        PLAYING: "PLAYING",
    } as const,
    Substate: {
        IDLE: "IDLE",
        SELECTED_PIECE_ON_BOARD: "SELECTED_PIECE_ON_BOARD",
        SELECTED_PIECE_IN_INVENTORY: "SELECTED_PIECE_IN_INVENTORY",
    } as const,
} as const;
export namespace GamePageState {
    export type Superstate = typeof GamePageState.Superstate[keyof typeof GamePageState.Superstate];
    export type Substate = typeof GamePageState.Substate[keyof typeof GamePageState.Substate];
}
export type GamePageState = {
    superstate: GamePageState.Superstate,
    substate: GamePageState.Substate,
}
