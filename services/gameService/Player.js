const { Socket } = require('socket.io');

const assert = require("assert");


/**
 * @typedef {string} PlayerID
 */
const PlayerID = undefined;


/**
 * @typedef {Object} UserProfile_InGame
 *
 * @prop {string} username
 * @prop {string} profilePicture
 * @prop {number} elo
 * @prop {number} liveWinStreak
 */


class Player {
    /**
     * @param {PlayerID} playerId
     * @param {UserID} userId
     * @param {UserToken} userToken
     * @param {UserProfile_InGame} userProfile
     */
    constructor(playerId, userId, userToken, userProfile) {
        /** @private @type {PlayerID} */
        this._playerId = playerId;

        /** @private @type {UserID} */
        this._userId = userId;

        /** @private @type {UserToken} */
        this._userToken = userToken;

        /** @private @type {unknown} */
        this._userProfile = userProfile;

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

    /** @type {UserProfile_InGame} */
    get userProfile() {
        return this._userProfile;
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
    static genUserProfile() {
        return {
            username: "Bot",
            profilePicture: "", // TODO : Add a pp for bots
            elo: 0,             // TODO (maybe) : Set different ELO based on the level of the AI
            liveWinStreak: 0,
        }
    }

    constructor (playerId, AI_Impl) {
        super(playerId, playerId, playerId, Bot.genUserProfile());
        this._ai;

        // Fake socket to be notified of game's updates
        this.socket = Object.freeze({
            emit: (msg, payload, acknowledgement) => {
                const { GamesManager } = require("./GamesManager");
                const game = GamesManager.getGameById(this._gameId);

                switch (msg) {
                    case "start-game":
                        console.log("\n\n..................................................\n");
                        console.log("Initialising bot's AI");
                        console.log("\n..................................................\n\n");

                        const opponent = game.players.find(p => p.playerId !== this._playerId);
                        const opponentId = opponent ? opponent.playerId : null;

                        this._ai = new AI_Impl(
                            this._playerId,
                            game.board,                                 // TODO : Giving an immutable reference of the board
                            game.getInventoryOfPlayer(this._playerId),  // TODO : Giving an immutable reference of the inventory
                            game.getInventoryOfPlayer(opponentId),
                            opponentId
                        );

                        assert(this._ai !== undefined, "[Bot::socket <- \"start-game\"]: AI shouldn't be undefined");
                        break;

                    case "start-turn":
                        assert(this._ai !== undefined, "[Bot::socket <- \"start-turn\"]: AI shouldn't be undefined");

                        // Uncomment code below to debug AI :
                        // ------------------------------------
                        //
                        // assert(this._ai._getLegalActions().every(act => {
                        //     try {
                        //         game.actionValidator.validate(act);
                        //     } catch (_) {
                        //         console.log("This action is invalid:", act);
                        //         return false;
                        //     }
                        //     return true;
                        // }));
                        // console.log("\n\nAI WORKS PERFECTLY\n\n");

                        game.onPlayerAction(this._ai.computeNextAction());
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
