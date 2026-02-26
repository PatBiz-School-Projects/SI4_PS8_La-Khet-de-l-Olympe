const { Player } = require("../Player");

const { Board } = require("../entities/board");
const { Piece } = require("../entities/piece");
const LaserService = require("./laserService");


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


class Game {
    constructor(gameId, players) {
        this.board = new Board();
        this.board.init();

        this.laserService = new LaserService(this.board);

        /** @private @type {GameID} */
        this._gameId = gameId;

        /** @private @type {Player[]} */
        this._players = players;

        /** @private @type {GameState} */
        this._state = GameState.RUNNING;

        /** @private @type {number} */
        this._turnCount = 1;

        /** @private @type {Player} */
        this._currActivePlayer = players[0];

        /** @private @type {Player|null} */
        this._winner = null;

        this.ACTIONS = {
            move: ({piece, from, to}) => {
                // DEBUG::
                console.log("Moving piece: ", piece, "from:", from, "to:", to);

                this.board.movePiece(Piece.fromDTO(piece), from, to);
                return this.board.toDTO();
            },
            place: ({piece, pos}) => {
                // DEBUG::
                console.log("Placing piece:", piece, "at:", pos);

                this.board.placePiece(Piece.fromDTO(piece), pos);
                return this.board.toDTO();
            },
            rotate: ({piece, pos, rotation}) => {
                // DEBUG::
                console.log("Rotating piece:", piece, "at:", pos, "to the", rotation);

                this.board.rotatePiece(Piece.fromDTO(piece), pos, rotation);
                return this.board.toDTO();
            },
            switch: ({piece1, pos1, piece2, pos2}) => {
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


    nextTurn() {
        this._turnCount++;
        this._currActivePlayer = this.players[(this._turnCount-1)%2];
    }


    processLaserHit() {
        const {path, destroyedPieces} = this.laserService.fireLaser(this._currActivePlayer);

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
                if (piece.type === "Pyramid" && piece.owner !== this._currActivePlayer) {
                    // TODO : Adding the pyramid into the inventory of the current player
                } else {
                    this.board.removePiece(piece.x, piece.y);
                }
            }
        }

        return { path };
    }
}

module.exports = { Game, GameID }
