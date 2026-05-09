const { Game, GameID, GameMode } = require("./manager/game");
const { Player, PlayerID } = require("./Player");

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

    /** @private @readonly */
    static _scheduler = {
        /** @type {Record<GameID, Record<PlayerID, Timeout>>} */
        gamesForfeiture: {},

        /** @type {Record<GameID, Timeout>} */
        gamesCleanup: {},
    }


    ////////////////////////////////////////////////////////////////////////////


    /** @type {GameID[]} */
    static get waitingRoomsId() {
        return Object.keys(this._waitingRooms);
    }

    /** @type {GameID[]} */
    static get runningGamesId() {
        return Object.keys(this._games);
    }

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
        this.closeWaitingRoom(gameId);

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

    /**
     * Close the waiting room with the given id
     *
     * @param {GameID} gameId
     */
    static closeWaitingRoom(gameId) {
        delete this._waitingRooms[gameId];
    }


    ////////////////////////////////////////////////////////////////////////////


    static hasScheduledForfeiture(gameId, playerId = undefined) {
        const hasAForfeitureForGame = Boolean(this._scheduler.gamesForfeiture[gameId]);

        if (!playerId) {
            return hasAForfeitureForGame;
        }

        return hasAForfeitureForGame && Boolean(this._scheduler.gamesForfeiture[gameId][playerId]);
    }

    static scheduleForfeiture(gameId, playerId, delayInMs) {
        if (!this._scheduler.gamesForfeiture[gameId]) {
            this._scheduler.gamesForfeiture[gameId] = {};
        }

        this._scheduler.gamesForfeiture[gameId][playerId] = setTimeout(() => {
            const game = this.getGameById(gameId);
            const player = game.getPlayerById(playerId);

            game.onPlayerForfeit(player);

            delete this._scheduler.gamesForfeiture[gameId][playerId];
        }, delayInMs);
    }

    static cancelForfeiture(gameId, playerId) {
        if (!this.hasScheduledForfeiture(gameId, playerId)) {
            return;
        }

        clearTimeout(this._scheduler.gamesForfeiture[gameId][playerId]);
        delete this._scheduler.gamesForfeiture[gameId][playerId];
    }


    ////////////////////////////////////////////////////////////////////////////


    // TODO : Make a better game cleanup :

    /**
     * Ends a given game.
     *
     * @param {GameID} gameId
     * @param {GameSummary} summary
     * @param {boolean} isRated
     */
    static endGame(gameId, summary=undefined,isRated=true) {
        if (summary) {
            GameSummariesRepository.save(gameId, summary)
                .then(
                    _ => console.log(`Successfully saved game w/ id '${gameId}'`)
                )
                .catch(
                    err => console.error(`Failed to save game w/ id '${gameId}' bcs:`, err)
                );

            if(isRated) {
                const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

                for (const player of this._games[gameId].players) {
                    fetch(`${USER_SERVICE_URL}/internal/api/users/${player.userId}/stats`, {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify(summary.statsUpdates[player.playerId]),
                    })
                        .then(
                            ans => (
                                (ans.ok)
                                    ? console.log(`Successfully updated stats of user w/ id '${player.userId}'`)
                                    : ans.json().then(({error: err}) => console.error(`Failed to update stats of user w/ id '${player.userId} bcs:`, err))
                            )
                        )
                        .catch(
                            err => console.error(`Failed to update stats of user w/ id '${player.userId} bcs:`, err)
                        );
                }
            }
        }
    }

    static hasScheduledCleanup(gameId) {
        return Boolean(this._scheduler.gamesCleanup[gameId]);
    }

    static scheduleCleanup(gameId, delayInMs) {
        this._scheduler.gamesCleanup[gameId] = setTimeout(async () => {
            const game = this.getGameById(gameId);

            const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL;
            try {
                const response = await fetch(`${CHAT_SERVICE_URL}/internal/api/chats/${gameId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({/* nothing */}),
                });

                if (!response.ok) {
                    console.error(`Failed to close chat of game '${gameId}' bcs:`, err);
                }
            } catch (err) {
                console.error(`Unexpected error occured while closing chat of game '${gameId}':`, err)
            }

            console.log(`Successfully closed chat of game '${gameId}'`);

            delete this._games[gameId];
            delete this._scheduler.gamesCleanup[gameId];

            console.log(`Closed game '${gameId}'`);
        }, delayInMs);
    }

    static cancelCleanup(gameId) {
        if (!this.hasScheduledCleanup(gameId)) {
            return;
        }

        clearTimeout(this._scheduler.gamesCleanup[gameId]);
        delete this._scheduler.gamesCleanup[gameId];
    }
}

module.exports = { GamesManager };
