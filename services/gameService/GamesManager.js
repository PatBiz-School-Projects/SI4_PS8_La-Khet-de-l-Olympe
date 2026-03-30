const { Game, GameID, GameMode } = require("./manager/game");
const { Player } = require("./Player");

const { GameSummariesRepository } = require("./repositories/GameSummaryRepository");

const { randomUUID } = require("node:crypto");


class WaitingRoom {
    static SIZE = 2;

    constructor(mode) {
        /** @private @type {GameMode} */
        this._mode = mode;

        /** @private @type {Player[]} */
        this._players = []; // The players in the waiting room

        /** @private @type {number} */
        this._openedAt = Date.now();
    }

    /** @type {GameMode} */
    get mode() {
        return this._mode;
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
    static get waitingRoomsId() {
        return Object.keys(this._waitingRooms);
    }

    /** @type {GameID[]} */
    static get runningGamesId() {
        return Object.keys(this._games);
    }


    /**
     * Creates a new game in a waiting state.
     *
     * @param {GameMode} mode
     *
     * @returns {GameID} The id of the game created (initially a waiting room)
     */
    static newGame(mode = GameMode.MULTIPLAYER) {
        const gameId = randomUUID();
        this._waitingRooms[gameId] = new WaitingRoom(mode);
        return gameId;
    }

    /**
     * Starts a game that was in a waiting state
     *
     * @param {GameID} gameId
     *
     * @throws if no waiting room have the given `gameId`
     */
    static startGame(gameId) {
        const waitingRoom = this._waitingRooms[gameId];
        if (!waitingRoom) {
            throw new Error(`Game with id=${gameId} not found`);
        }

        this._games[gameId] = new Game(gameId, waitingRoom.players, waitingRoom.mode);
        delete this._waitingRooms[gameId];

        for (const player of waitingRoom.players) {
            try {
                player.socket.emit("start-game");
            } catch (err) {
                if (player.constructor.name === "Bot") {
                    console.error("Bot doesn't have a socket. Caused:", err);
                }
            }
        }
    }

    /**
     * Adds a player inside an already existing waiting room.
     *
     * @param {Player} player
     * @param {GameID} gameId
     *
     * @throws if no waiting room have the given `gameId`
     */
    static registerPlayerInRoom(player, gameId) {
        const waitingRoom = this._waitingRooms[gameId];
        if (!waitingRoom) {
            throw new Error(`Game with id=${gameId} not found`);
        }

        waitingRoom.addPlayer(player);
        player.gameId = gameId;
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

        let gameId = oldestWaitingRoom?.gameId;
        if (!gameId) {
            // If a room hasn't been found then we create a new one
            gameId = this.newGame();
        }
        this.registerPlayerInRoom(player, gameId);
        return gameId;
    }

    ////////////////////////////////////////////////////////////////////////////

    /**
     * @param {GameID} gameId
     *
     * @returns {WaitingRoom}
     * @throws if no match has been found for the given waiting room game id
     */
    static getWaitingRoomById(gameId) {
        const waitingRoom = this._waitingRooms[gameId];
        if (!waitingRoom) {
            throw new Error(`Waiting room with id=${gameId} not found`);
        }

        return waitingRoom;
    }


    /**
     * @param {GameID} gameId
     *
     * @returns {Game}
     * @throws if no match has been found for the given game id
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
     * @param {unknown} summary
     */
    static endGame(gameId, summary=undefined) {
        if (summary) {
            GameSummariesRepository.save(gameId, summary)
                .then(
                    _ => console.log(`Successfully saved game w/ id '${gameId}'`)
                )
                .catch(
                    err => console.error(`Failed to save game w/ id '${gameId}' bcs:`, err)
                );

            const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

            for (const player of this._games[gameId].players) {
                fetch(`${USER_SERVICE_URL}/api/users/${player.userId}/stats`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(summary.statsUpdates[player.playerId]),
                })
                    .then(
                        ans => (
                            (ans.ok)
                            ? console.log(`Successfully updated stats of user w/ id '${player.userId}'`)
                            : console.error(`Failed to update stats of user w/ id '${player.userId} bcs:`, ans.error)
                        )
                    )
                    .catch(
                        err => console.error(`Failed to update stats of user w/ id '${player.userId} bcs:`, err)
                    );
            }
        }

        // TODO : Delete game only when both player have left the game (be cautious of involuntary disconnection)
        // delete this._games[gameId];
    }
}

module.exports = { GamesManager };
