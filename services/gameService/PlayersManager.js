const { Player, PlayerID } = require('./Player');

const { randomUUID } = require('node:crypto');


class PlayersManager {
    /** @private */
    constructor() { throw new Error(`${this.constructor.name} is not instantiable`); }

    /** @private @type {Record<PlayerID, Player>} */
    static _players = {};

    /**
     * @param {UserID} userId The id of the associated user
     * @param {UserToken} userToken The authentication token of the client to the user account
     *
     * @returns {PlayerID}
     */
    static newPlayer(userId, userToken) {
        const playerId = randomUUID();
        this._players[playerId] = new Player(playerId, userId, userToken);
        return playerId;
    }

    /**
     * Deletes the player with the given id
     *
     * @param {*} playerId
     */
    static delPlayer(playerId) {
        delete this._players[playerId];
    }

    ////////////////////////////////////////////////////////////////////////////

    /**
     * @param {PlayerID} playerId
     *
     * @returns {Player}
     * @throws If no match has been found
     */
    static getPlayerById(playerId) {
        const player = this._players[playerId];
        if (!player) {
            throw new Error(`Player with id=${playerId} not found`);
        }
        return player;
    }
}


module.exports = { PlayersManager };