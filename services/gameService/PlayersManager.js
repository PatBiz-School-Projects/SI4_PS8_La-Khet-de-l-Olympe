const { Player, Bot, PlayerID } = require('./Player');

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
     * @returns {Player}
     */
    static newPlayer(userId, userToken) {
        const playerId = randomUUID();
        const player = new Player(playerId, userId, userToken);
        this._players[playerId] = player;
        return player;
    }

    static newBot(AI_Impl) {
        const playerId = `ai#${randomUUID()}`;
        const bot = new Bot(playerId, AI_Impl);
        this._players[playerId] = bot;
        return bot;
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
     * @throws if no match has been found for the given player id
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
