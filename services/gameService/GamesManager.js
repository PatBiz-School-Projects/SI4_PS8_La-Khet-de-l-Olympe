const { Game, GameID } = require('./manager/game');
const { Player } = require('./Player');

const { randomUUID } = require('node:crypto');


// NOTE : Currently the games manager cannot manage more than one at a time.
// TODO : Enable games multiplexing


class WaitingRoom {
    static SIZE = 2;

    constructor() {
        /** @private @type {Player[]} */
        this._players = []; // The players in the waiting room

        /** @private @type {number} */
        this._openedAt = Date.now();
    }

    /** @type {Player[]} */
    get players() {
        return [ ...this._players ];
    }

    /** @type {number} */
    get openedAt() {
        return this._openedAt;
    }

    /**
     * @param {Player} player
     */
    addPlayer(player) {
        this._players.push(player);
    }

    /**
     * @returns {boolean}
     */
    isFull() {
        return this._players.length === WaitingRoom.SIZE;
    }
}


class GamesManager {
    /** @private */
    constructor() { throw new Error(`${this.constructor.name} is not instantiable`); }

    /** @private @type {Record<GameID, WaitingRoom>} */
    static _waitingRooms = {};

    /** @private @type {Record<GameID, Game>} */
    static _games = {};


    /** @type {GameID[]} */
    static get waitingGamesId() {
        return Object.keys(this._waitingRooms);
    }

    /** @type {GameID[]} */
    static get runningGamesId() {
        return Object.keys(this._games);
    }


    /**
     * Creates a new game in a waiting state.
     *
     *  @returns {GameID} The id of the game created (initially a waiting room)
     */
    static newGame() {
        const gameId = randomUUID();
        this._waitingRooms[gameId] = new WaitingRoom();
        return gameId;
    }

    /**
     * Starts a game that was in a waiting state
     *
     * @param {GameID} gameId
     *
     * @throws If no waiting room have the given `gameId`
     */
    static startGame(gameId) {
        const waitingRoom = this._waitingRooms[gameId];
        if (!waitingRoom) {
            throw new Error(`Game with id=${gameId} not found`);
        }

        this._games[gameId] = new Game(gameId, waitingRoom.players);
        delete this._waitingRooms[gameId];
    }

    /**
     * Adds a player inside an already existing waiting room.
     *
     * @param {Player} player
     * @param {GameID} gameId
     *
     * @throws If no waiting room have the given `gameId`
     */
    static registerPlayerInRoom(player, gameId) {
        const waitingRoom = this._waitingRooms[gameId];
        if (!waitingRoom) {
            throw new Error(`Game with id=${gameId} not found`);
        }

        waitingRoom.addPlayer(player);
        if (waitingRoom.isFull()) {
            this.startGame(gameId, waitingRoom);
        }
    }

    /**
     * Finds a waiting room for the given player.
     *
     * @param {Player} player
     */
    static findRoomFor(player) {
        // TODO : Implement a more advanced logic to match a player with another one of its level
        const oldestWaitingRoom = Object.entries(this._waitingRooms)
            .map(([gameId, val]) => ({gameId, openedAt: val.openedAt}))
            .sort((r1, r2) => r2.openedAt - r1.openedAt)[0];

        let waitingRoom = oldestWaitingRoom;
        if (!waitingRoom) {
            // If a room hasn't been found then we create a new one
            waitingRoom = this.newGame();
        }
        this.registerPlayerInRoom(player, waitingRoom.gameId);
        return waitingRoom.gameId;
    }

    ////////////////////////////////////////////////////////////////////////////

    /**
     * @param {GameID} gameId
     *
     * @returns {Game}
     * @throws If no match has been found
     */
    static getGameById(gameId) {
        const game = this._games[gameId];
        if (!game) {
            throw new Error(`Game with id=${gameId} not found`);
        }

        return game;
    }

    ////////////////////////////////////////////////////////////////////////////

    /**
     * Ends a given game.
     *
     * @param {GameID} gameId
     */
    static endGame(gameId) {
        delete this._games[gameId];
    }
}

module.exports = { GamesManager };
