import { GamePageAction, GamePageActionType } from "./GamePageAction.js";
import { GameAction, GameActionType } from "./GameAction.js";


/**
 * @typedef {Object} GamePageState
 *
 * @prop {typeof GamePageState.Superstate[keyof typeof GamePageState.Superstate]} superstate
 * @prop {typeof GamePageState.Substate[keyof typeof GamePageState.Substate]} substate
 */
export const GamePageState = /** @type {const} */ ({
    Superstate: /** @type {const} */ ({
        SPECTATING: "SPECTATING",
        PLAYING: "PLAYING",
    }),
    Substate: /** @type {const} */ ({
        IDLE: "IDLE",
        SELECTED_PIECE_ON_BOARD: "SELECTED_PIECE_ON_BOARD",
        SELECTED_PIECE_IN_INVENTORY: "SELECTED_PIECE_IN_INVENTORY",
    }),
});

/**
 * @typedef {typeof GamePageState.Superstate[keyof typeof GamePageState.Superstate]} GamePageState_Superstate
 */

/**
 * @typedef {typeof GamePageState.Substate[keyof typeof GamePageState.Substate]} GamePageState_Substate
 */


////////////////////////////////////////////////////////////////////////////////
// GameState_Impl
////////////////////////////////////////////////////////////////////////////////

// TODO : Refactoring `GameState_Impl` to make it expandable :
// - making `GameState_Impl`, `GamePageState_Superstate_Impl` & `GamePageState_Substate_Impl` abstract
// - subclassing `GamePageState_Superstate_Impl` (& GamePageState_Substate_Impl) for each superstate (resp. substate) of `GameState`

/**
 * Implementation/logic of `GameState`.
 *
 * Note that `GameState` is hierarchical thus `GameState_Impl` is too.
 *
 * @see GamePageState_Superstate_Impl
 * @see GamePageState_Substate_Impl
 */
export class GamePageState_Impl {
    /**
     * @param {GamePageState} _
     * @param {unknown} context
     */
    constructor({superstate, substate}, context) {
        /** @private @type {GamePageState_Superstate_Impl} */
        this._superstateImpl = new GamePageState_Superstate_Impl(superstate, context);

        /** @private @type {GamePageState_Substate_Impl} */
        this._substateImpl = new GamePageState_Substate_Impl(substate, context)
    }

    /** @type {GamePageState} */
    get state() {
        return {
            superstate: this._superstateImpl.state,
            substate: this._substateImpl.state,
        };
    }


    /**
     * @param {GamePageAction} pageAction
     *
     * @return {{newState: GamePageState_Impl, gameAction: GameAction}}
     */
    on(pageAction) {
        const {newSuperstate, newSubstate, newContext, gameAction} = this._superstateImpl.on(
            pageAction, this._substateImpl.on(pageAction)
        );
        return {
            newStateImpl: new GamePageState_Impl({superstate: newSuperstate, substate: newSubstate}, newContext),
            gameAction: gameAction,
        };
    }
}


class GamePageState_Superstate_Impl {
    /**
     * @param {GamePageState_Superstate} state
     * @param {unknown} context
     */
    constructor(state, context) {
        /** @private @type {GamePageState_Superstate} */
        this._state = state;

        /** @private @type {unknown} */
        this._context = context;
    }

    /** @type {GamePageState_Superstate} */
    get state() {
        return this._state;
    }


    /**
     * @param {GamePageAction} pageAction
     * @param {GamePageState_Substate_Impl} newSubstate
     *
     * @return {{
     *     newSuperstate: GamePageState_Superstate,
     *     newSubstate: GamePageState_Substate,
     *     newContext: unknown,
     *
     *     gameAction: GameAction,
     * }}
     */
    on(pageAction, substateAns) {
        switch (this._state) {
            case GamePageState.Superstate.SPECTATING:
                return this._onKnowing__SPECTATING(pageAction, substateAns);
            case GamePageState.Superstate.PLAYING:
                return this._onKnowing__PLAYING(pageAction, substateAns);
        }
    }

    _onKnowing__SPECTATING(pageAction, substateAns) {
        const {newSubstate, newContext, gameAction} = substateAns;

        switch (pageAction.type) {
            case GamePageActionType.START_TURN:
                return {
                    newSuperstate: GamePageState.Superstate.PLAYING,
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            case GamePageActionType.END_TURN:
                throw new Error("Should never happen");

            case GamePageActionType.CLICKED_PIECE_IN_INVENTORY:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: gameAction,
                };

            case GamePageActionType.CLICKED_PIECE_ON_BOARD:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: gameAction,
                };

            case GamePageActionType.CLICKED_EMPTY_CELL:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: gameAction,
                };

            case GamePageActionType.CLICKED_ROTATE_ARROW:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: gameAction,
                };

            case GamePageActionType.CANCEL:
                return {
                    newSuperstate: GamePageState.Superstate.SPECTATING,
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            default:
                throw new Error(`Not supported game page action type: ${pageAction.type} in state ${this._state}`);
        }
    }

    _onKnowing__PLAYING(pageAction, substateAns) {
        const {newSubstate, newContext, gameAction} = substateAns;

        switch (pageAction.type) {
            case GamePageActionType.START_TURN:
                throw new Error("Should never happen");

            case GamePageActionType.END_TURN:
                return {
                    newSuperstate: GamePageState.Superstate.SPECTATING,
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_PIECE_IN_INVENTORY:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: gameAction,
                };

            case GamePageActionType.CLICKED_PIECE_ON_BOARD:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_EMPTY_CELL:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_ROTATE_ARROW:
                return {
                    newSuperstate: this._state,
                    newSubstate: newSubstate,
                    newContext: newContext,
                    gameAction: undefined,
                };

            case GamePageActionType.CANCEL:
                return {
                    newSuperstate: GamePageState.Superstate.SPECTATING,
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            default:
                throw new Error(`Not supported game page action type: ${pageAction.type} in state ${this._state}`);
        }
    }
}


class GamePageState_Substate_Impl {
    /**
     * @param {GamePageState_Substate} state
     * @param {unknown} context
     */
    constructor(state, context) {
        /** @private @type {GamePageState_Substate} */
        this._state = state;

        /** @private @type {unknown} */
        this._context = context;
    }

    /** @type {GamePageState_Substate} */
    get state() {
        return this._state;
    }


    /**
     * @param {GamePageAction} pageAction
     */
    on(pageAction) {
        switch (this._state) {
            case GamePageState.Substate.IDLE:
                return this._onKnowing__IDLE(pageAction);
            case GamePageState.Substate.SELECTED_PIECE_ON_BOARD:
                return this._onKnowing__SELECTED_PIECE_ON_BOARD(pageAction);
            case GamePageState.Substate.SELECTED_PIECE_IN_INVENTORY:
                return this._onKnowing__SELECTED_PIECE_IN_INVENTORY(pageAction);
        }
    }

    /**
     * @private
     *
     * @param {GamePageAction} pageAction
     */
    _onKnowing__IDLE(pageAction) {
        switch (pageAction.type) {
            case GamePageActionType.START_TURN:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.END_TURN:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_PIECE_IN_INVENTORY:
                return {
                    newSubstate: GamePageState.Substate.SELECTED_PIECE_IN_INVENTORY,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_PIECE_ON_BOARD:
                return {
                    newSubstate: GamePageState.Substate.SELECTED_PIECE_ON_BOARD,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_EMPTY_CELL:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_ROTATE_ARROW:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            case GamePageActionType.CANCEL:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            default:
                throw new Error(`Not supported game page action type: ${pageAction.type} in state ${this._state}`);
        }
    }

    /**
     * @private
     *
     * @param {GamePageAction} pageAction
     */
    _onKnowing__SELECTED_PIECE_ON_BOARD(pageAction) {
        switch (pageAction.type) {
            case GamePageActionType.START_TURN:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.END_TURN:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_PIECE_IN_INVENTORY:
                return {
                    newSubstate: GamePageState.Substate.SELECTED_PIECE_IN_INVENTORY,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_PIECE_ON_BOARD:
                return {
                    newSubstate: GamePageState.Substate.SELECTED_PIECE_ON_BOARD,
                    newContext: { ...pageAction.payload }, // In case the switch action is refused
                    gameAction: {
                        type: GameActionType.SWITCH_PIECES,
                        payload: {
                            piece1: this._context.piece,
                            pos1: this._context.pos,
                            piece2: pageAction.payload.piece,
                            pos2: pageAction.payload.pos,
                        },
                    },
                };

            case GamePageActionType.CLICKED_EMPTY_CELL:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: {
                        type: GameActionType.MOVE_PIECE,
                        payload: {
                            piece: this._context.piece,
                            from: this._context.pos,
                            to: pageAction.payload.pos,
                        },
                    },
                };

            case GamePageActionType.CLICKED_ROTATE_ARROW:
                return {
                    newSubstate: GamePageState.Substate.SELECTED_PIECE_ON_BOARD,
                    newContext: this._context,
                    gameAction: {
                        type: GameActionType.ROTATE_PIECE,
                        payload: {
                            piece: this._context.piece,
                            pos: this._context.pos,
                            rotation: pageAction.payload.rotation,
                        },
                    },
                };

            case GamePageActionType.CANCEL:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            default:
                throw new Error(`Not supported game page action type: ${pageAction.type} in state ${this._state}`);
        }
    }

    /**
     * @private
     *
     * @param {GamePageAction} pageAction
     */
    _onKnowing__SELECTED_PIECE_IN_INVENTORY(pageAction) {
        switch (pageAction.type) {
            case GamePageActionType.START_TURN:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.END_TURN:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_PIECE_IN_INVENTORY:
                return {
                    newSubstate: GamePageState.Substate.SELECTED_PIECE_IN_INVENTORY,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_PIECE_ON_BOARD:
                return {
                    newSubstate: GamePageState.Substate.SELECTED_PIECE_ON_BOARD,
                    newContext: { ...pageAction.payload },
                    gameAction: undefined,
                };

            case GamePageActionType.CLICKED_EMPTY_CELL:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: {
                        type: GameActionType.PLACE_PIECE,
                        payload: {
                            piece: this._context.piece,
                            pos: pageAction.payload.pos,
                        }
                    },
                };

            case GamePageActionType.CLICKED_ROTATE_ARROW:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: {
                        type: GameActionType.PLACE_PIECE,
                        payload: {
                            piece: this._context.piece,
                            pos: pageAction.payload.pos,
                        }
                    },
                };

            case GamePageActionType.CANCEL:
                return {
                    newSubstate: GamePageState.Substate.IDLE,
                    newContext: {},
                    gameAction: undefined,
                };

            default:
                throw new Error(`Not supported game page action type: ${pageAction.type} in state ${this._state}`);
        }
    }
}
