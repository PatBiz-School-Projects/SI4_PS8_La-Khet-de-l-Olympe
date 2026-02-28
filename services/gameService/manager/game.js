const { Player, PlayerID } = require("../Player");

const { Board }     = require("../entities/board");
const { Inventory } = require("../entities/inventory");
const { Piece }     = require("../entities/piece");

const LaserService = require("./laserService");
const { ActionValidator } = require("./ActionValidator");


/**
 * @typedef {string} GameID
 */
const GameID = undefined;


/**
 * @enum {typeof GameState[keyof typeof GameState]} GameState
 */
const GameState = Object.freeze({
    RUNNING: "RUNNING",
    GAME_OVER: "GAME_OVER",
    DRAW : "DRAW",
    PAUSED: "PAUSED",
});


/**
 * @enum {typeof GameMode[keyof typeof GameMode]} GameMode
 */
const GameMode = Object.freeze({
    SOLO: "SOLO",
    LOCAL_MULTIPLAYER: "LOCAL_MULTIPLAYER",
    MULTIPLAYER: "MULTIPLAYER",
});


class Game {
    constructor(gameId, players, mode) {
        /** @private @type {GameID} */
        this._gameId = gameId;

        /** @private @type {Player[]} */
        this._players = players;

        /** @private @type {Record<PlayerID, Inventory>} */
        this._playerInventories = {
            [players[0].playerId]: new Inventory(players[0].playerId),
            [players[1].playerId]: new Inventory(players[1].playerId),
        };

        /** @private @type {GameState} */
        this._state = GameState.RUNNING;

        /** @private @type {GameMode} */
        this._mode = mode;

        /** @private @type {number} */
        this._turnCount = 1;

        /** @private @type {Player} */
        this._currActivePlayer = players[0];

        /** @private @type {Player|null} */
        this._winner = null;

        this.board = new Board();
        this.board.init();
        this.laserService = new LaserService(this.board);
        this.actionValidator = new ActionValidator(this);

        this.ACTIONS = {
            move: ({playerId, piece, from, to}) => {
                // DEBUG::
                console.log("Moving piece: ", piece, "from:", from, "to:", to);

                this.board.movePiece(Piece.fromDTO(piece), from, to);
                return this.board.toDTO();
            },
            place: ({playerId, piece, pos}) => {
                // DEBUG::
                console.log("Placing piece:", piece, "at:", pos);

                this.board.placePiece(Piece.fromDTO(piece), pos);
                this._playerInventories[playerId].popPyramid();
                return this.board.toDTO();
            },
            rotate: ({playerId, piece, pos, rotation}) => {
                // DEBUG::
                console.log("Rotating piece:", piece, "at:", pos, "to the", rotation);

                this.board.rotatePiece(Piece.fromDTO(piece), pos, rotation);
                return this.board.toDTO();
            },
            switch: ({playerId, piece1, pos1, piece2, pos2}) => {
                // DEBUG::
                console.log("Switching piece: ", piece1, "at:", pos1, "with piece:", piece2, "at: ", pos2);

                this.board.switchPieces(Piece.fromDTO(piece1), pos1, Piece.fromDTO(piece2), pos2);
                return this.board.toDTO();
            },
        }
    }

    /** @type {GameID} */
    get id() {
        return this._gameId;
    }

    /** @type {Player[]} */
    get players() {
        return [ ...this._players ];
    }

    /** @type {Player} */
    get currActivePlayer() {
        return this._currActivePlayer;
    }

    /** @type {GameState} */
    get state() {
        return this._state;
    }

    /** @type {GameMode} */
    get mode() {
        return this._mode;
    }

    /**
     * @param {PlayerID} playerId
     *
     * @returns {Inventory}
     * @throws If the id of the player doesn't correspond to a player in the game
     */
    getInventoryOfPlayer(playerId) {
        if (!playerId in this._playerInventories) {
            throw new Error(`No player has id=${playerId}`);
        }
        return this._playerInventories[playerId];
    }


    isRunning() {
        return this._state === GameState.RUNNING;
    }

    isFinished() {
        return this._state === GameState.GAME_OVER || this._state === GameState.DRAW;
    }

    /**
     * @param {Player} player
     *
     * @returns {boolean}
     */
    playerCanPlay(player) {
        return this.isRunning() && player.playerId === this._currActivePlayer.playerId;
    }

    /**
     * @param {Player} player
     *
     * @returns {boolean}
     */
    playerCanSwap(player) {
        // TODO : implement cooldown
        return true;
    }


    nextTurn() {
        this._currActivePlayer.socket.emit("end-turn", {});

        this._turnCount++;
        this._currActivePlayer = this._players[(this._turnCount-1)%2];

        this._currActivePlayer.socket.emit("start-turn", {
            playerId: this._currActivePlayer.playerId
        });
    }


    onAction(action) {
        this.actionValidator.validate(action);

        if (action.method === "switch" && action.args.piece2.type == "Sphinx") {
            return {
                actionRes: this.ACTIONS[action.method](action.args),
                laserRes: undefined,
            };
        } else {
            return {
                actionRes: this.ACTIONS[action.method](action.args),
                // laserRes: this.processLaserHit(),
                laserRes: undefined, // Until the owner corresponds to the player's id
            };
        }
    }


    processLaserHit() {
        const {path, destroyedPieces} = this.laserService.fireLaser(this.currActivePlayer);

        for (const piece of destroyedPieces) {
            if(piece.type === "Pharaoh"){
                this._state = GameState.GAME_OVER;
                if (this._winner !== null) {
                    this._state = GameState.DRAW;
                    this._winner = null;
                } else if (piece.owner !== this._currActivePlayer) {
                    this._winner = this._currActivePlayer;
                } else {
                    this._winner = piece.owner;
                }
            } else {
                if (piece.type === "Pyramid") {
                    const opponent = this.players.filter(player => player !== this._currActivePlayer)[0];
                    this._playerInventories[opponent.playerId].pushPyramid();
                }
                this.board.removePiece({x:piece.x, y:piece.y});
            }
        }

        return { path };
    }
}

module.exports = { Game, GameID, GameMode }
