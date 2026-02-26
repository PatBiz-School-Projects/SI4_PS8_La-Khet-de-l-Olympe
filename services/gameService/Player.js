const { Socket } = require('socket.io');


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

module.exports = { Player, PlayerID };
