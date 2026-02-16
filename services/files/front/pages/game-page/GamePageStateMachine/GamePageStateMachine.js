import { GameAction, GameActionType } from "./GameAction.js";
import { GamePageAction } from "./GamePageAction.js";

import { GamePageState, GamePageState_Impl } from "./GamePageState.js";


export class GamePageStateMachine {
    static Listener = class Listener {
        /**
         * @param {GameActionType[]} triggers
         * @param {(GameAction) => void|Promise<void>} callback
         * @param {() => void} free - The method to free the listener
         */
        constructor(triggers, callback, free) {
            /** @public @type {GameActionType[]} */
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
        const {newStateImpl, gameAction} = this._stateImpl.on(pageAction);
        this._stateImpl = newStateImpl;
        if (gameAction) {
            this.notifyListenersOf(gameAction);
        }
    }


    /**
     * @param {GameActionType[]} triggers
     * @param {(GameAction) => void|Promise<void>} callback
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
     * @param {GameAction} gameAction
     */
    notifyListenersOf(gameAction) {
        this._listeners
            .filter(listener => listener.triggers.includes(gameAction.type))
            .forEach(listener => listener.callback(gameAction));
    }
}



////////////////////////////////////////////////////////////////////////////////
// Exemple d'utilisation

const stateMachine = new GamePageStateMachine();

const listener = stateMachine.subscribe([], (action) => {
    console.log('Nouvel action:', action.type);
});

stateMachine.on({ type: 'START_TURN' });

listener.free();
