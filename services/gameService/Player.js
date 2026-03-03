const { Socket } = require('socket.io');

const { GamesManager } = require("./GamesManager");


/**
 * @typedef {string} PlayerID
 */
const PlayerID = undefined;


class Player {
    /**
     * @param {PlayerID} playerId
     * @param {UserID} userId
     * @param {UserToken} userToken
     */
    constructor(playerId, userId, userToken) {
        /** @private @type {PlayerID} */
        this._playerId = playerId;

        /** @private @type {UserID} */
        this._userId = userId;

        /** @private @type {UserToken} */
        this._userToken = userToken;

        /** @private @type {GameID} */
        this._gameId; // will be set once the player is registered in a room/game

        /** @public @type {Socket} */
        this.socket;
    }

    /** @type {PlayerID} */
    get playerId() {
        return this._playerId;
    }

    /** @type {UserID} */
    get userId() {
        return this._userId;
    }

    /** @type {UserToken} */
    get userToken() {
        return this._userToken;
    }

    /** @type {GameID} */
    get gameId() {
        return this._gameId;
    }
    set gameId(gameId) {
        if (this._gameId) {
            throw new Error("Cannot reassign player property 'gameId'");
        }
        this._gameId = gameId;
    }
}


class Bot extends Player {
    constructor (gameId, ai_bootloader) {
        super(`ai#${gameId}`, `ai#${gameId}`, `ai#${gameId}`)

        this.ai;

        // Fake socket to be notified of game's updates
        this.socket = Object.freeze({
            emit: (msg, payload, acknowledgement) => {
                // Boot the ai
                if (!this.ai) {
                    this.ai = ai_bootloader();
                }

                switch (msg) {
                    case "start-turn":
                        GamesManager.getGameById(gameId).onAction(ai.computeNextMove());
                        break;

                    // Add more if needed ...

                    default:
                        /* nothing */
                }
                if (acknowledgement) {
                    acknowledgement();
                }
            }
        });
    }
}

module.exports = { Player, Bot, PlayerID };
