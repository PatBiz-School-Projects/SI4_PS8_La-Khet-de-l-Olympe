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
}


class Bot extends Player {
    constructor (gameId, ai_bootloader) {
        super(`ai#${gameId}`, `ai#${gameId}`, `ai#${gameId}`)

        this.ai;

        // Fake socket to get notify of game's updates
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
