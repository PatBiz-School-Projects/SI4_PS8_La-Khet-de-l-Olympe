import { Coord } from "/game/logic/board/Coord.js";
import { Piece } from "/game/logic/board/Piece.js";


export type UIActionType = typeof UIActionType[keyof typeof UIActionType];
export declare const UIActionType = {
    VISUALISE_LEGAL_ACTION: "VISUALISE_LEGAL_ACTION",
    STOP_UI_ACTIONS: "STOP_UI_ACTIONS",
} as const;


export type UIActionPayload<T extends UIActionType> =
    T extends typeof UIActionType.VISUALISE_LEGAL_ACTION
        ? { piece: Piece, pos: Coord } :
    T extends typeof UIActionType.STOP_UI_ACTIONS
        ? undefined :
    never;


export type UIAction = {
    [K in UIActionType]: {type: K, payload: UIActionPayload<K>}
}[UIActionType];
