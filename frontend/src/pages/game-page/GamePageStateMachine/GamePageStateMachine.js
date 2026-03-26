import { GamePageAction } from "./GamePageAction.js";
import { GameAction, GameActionType } from "./GameAction.js";
import { UIAction, UIActionType } from "./UIAction.js";

import { GamePageState, GamePageState_Impl } from "./GamePageState.js";


export class GamePageStateMachine {
    static Listener = class Listener {
        /**
         * @param {GameActionType[]} triggers
         * @param {(GameAction|UIAction) => void|Promise<void>} callback
         * @param {() => void} free - The method to free the listener
         */
        constructor(triggers, callback, free) {
            /** @public @type {(GameActionType|UIActionType)[]} */
            this.triggers = triggers;

            /** @public @type {(GameAction) => void|Promise<void>} */
            this.callback = callback;

            /**
             * Free the listener
             */
            this.free = () => free();
        }
    }


    constructor() {
        /** @private @type {GamePageState_Impl} */
        this._stateImpl = new GamePageState_Impl({
            superstate: GamePageState.Superstate.SPECTATING, // By default everyone is spectating
            substate: GamePageState.Substate.IDLE,
        }, {});

        /** @private @type {InstanceType<GamePageStateMachine.Listener>[]} */
        this._listeners = [];
    }

    /**
     * @returns {GamePageState}
     */
    get state() {
        return { ...this._stateImpl.state };
    }

    /**
     * @returns {boolean}
     */
    isPlaying() {
        return this._stateImpl.state.superstate === GamePageState.Superstate.PLAYING;
    }

    /**
     * @returns {boolean}
     */
    isSpectating() {
        return this._stateImpl.state.superstate === GamePageState.Superstate.SPECTATING;
    }


    /**
     * @param {GamePageAction} pageAction
     */
    on(pageAction) {
        // DEBUG::
        console.log("Before page action:", pageAction, "state was:", this.state);

        const {newStateImpl, gameAction, uiAction} = this._stateImpl.on(pageAction);
        this._stateImpl = newStateImpl;

        // DEBUG::
        console.log("After page action:", pageAction, "state is:", this.state, "and game action is:", gameAction);

        if (gameAction) {
            this.notifyListenersOf(gameAction);
        }

        if (uiAction) {
            this.notifyListenersOf(uiAction);
        }
    }


    /**
     * @param {GameActionType[]} triggers
     * @param {(GameAction|UIAction) => void|Promise<void>} callback
     *
     * @returns {InstanceType<GamePageStateMachine.Listener>} the listener
     */
    subscribe(triggers, callback) {
        const listener = new GamePageStateMachine.Listener(
            triggers,
            callback,
            () => {
                this._listeners = this._listeners.filter(l => l !== listener);
            },
        )
        this._listeners.push(listener);
        return listener;
    }


    /**
     * @private
     *
     * @param {GameAction|UIAction} action
     */
    notifyListenersOf(action) {
        this._listeners
            .filter(listener => listener.triggers.includes(action.type))
            .forEach(listener => listener.callback(action.payload));
    }
}
