const { Player, PlayerID,Bot } = require("../Player");

const { Board }     = require("../entities/board");
const { Inventory } = require("../entities/inventory");
const { Piece }     = require("../entities/piece");

const { LaserService } = require("./laserService");
const { ActionValidator } = require("./ActionValidator");
const { ActionTimer } = require("./ActionTimer");

const { computeEloWithWinStreak, computeEloOnDraw } = require("./elo");

const assert = require("assert")


/**
 * @typedef {string} GameID
 */
const GameID = undefined;


/**
 * @enum {typeof GameState[keyof typeof GameState]}
 */
const GameState = Object.freeze({
    RUNNING: "RUNNING",
    GAME_OVER: "GAME_OVER",
    DRAW : "DRAW",
    PAUSED: "PAUSED",
});


/**
 * @enum {typeof GameMode[keyof typeof GameMode]}
 */
const GameMode = Object.freeze({
    SOLO: "SOLO",
    LOCAL_MULTIPLAYER: "LOCAL_MULTIPLAYER",
    MULTIPLAYER: "MULTIPLAYER",
});


class Game {
    /** @readonly */
    static TURN_LIMIT = 200; // 2x100 so that each player cannot do more than 100 actions

    constructor(gameId, players, mode) {
        assert(
            players.length === 2,
            "A game must have only 2 players for one game",
        );
        if (mode === "SOLO") assert(
            players.some(p => p.constructor.name === "Bot"),
            "If mode is solo then a player must be a bot",
        );


        /** @private @type {GameID} */
        this._gameId = gameId;

        /** @private @type {Player[]} */
        this._players = players;

        /** @private @type {GameMode} */
        this._mode = mode;

        /** @private @type {GameState} */
        this._state = GameState.RUNNING;

        /** @private @type {Record<PlayerID, Inventory>} */
        this._playerInventories = {
            [players[0].playerId]: new Inventory(players[0].playerId, "blue"),
            [players[1].playerId]: new Inventory(players[1].playerId, "red"),
        };


        /** @private @type {number} */
        this._turnCount = 1;

        this._totalMoves = 0;

        /** @private @type {Player} */
        this._currActivePlayer = players[0];

        /** @private @type {Player|null} */
        this._winner = null;

        this.board = new Board(this._players);
        this.board.init();
        this.laserService = new LaserService(this.board);
        this.actionValidator = new ActionValidator(this);
        this.actionTimer = new ActionTimer(this);
        if (!this._currActivePlayer.playerId.startsWith("ai#")) {
            this.actionTimer.start();
        }

        this._playersSwapCooldowns = {
            [players[0].playerId]: { "Sphinx": 0, "Pharaoh": 0 },
            [players[1].playerId]: { "Sphinx": 0, "Pharaoh": 0 },
        };

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

                this._playerInventories[playerId].popPyramid();

                this.board.placePiece(Piece.fromDTO(piece), pos);
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

                this._playersSwapCooldowns[playerId][piece2.type] = 4;

                this.board.switchPieces(Piece.fromDTO(piece1), pos1, Piece.fromDTO(piece2), pos2);
                return this.board.toDTO();
            },
        }
    }

    /** @type {GameID} */
    get gameId() {
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

    /** @type {Player | null} */
    get winner() {
        return this._winner;
    }

    /**
     * @param {PlayerID} playerId
     *
     * @returns {Player}
     * @throws if no player with the given id has been found
     */
    getPlayerById(playerId) {
        const player = this._players.find(p => p.playerId === playerId);
        if (!player) {
            throw new Error(`No player has id=${playerId}`);
        }
        return player;
    }

    /**
     * @param {PlayerID} playerId
     *
     * @returns {Inventory}
     * @throws if the player id cannot be mapped to a player in the game
     */
    getInventoryOfPlayer(playerId) {
        if (!(playerId in this._playerInventories)) {
            throw new Error(`No player has id=${playerId}`);
        }
        return this._playerInventories[playerId];
    }

    getPossibleMoveForPiece(pos) {
        const piece = this.board.getPieceAt(pos);
        if (!piece) return { moves: [], rotations: [], switches: [] };

        const possibleActions = {
            moves: [],
            rotations: ["left", "right"],
            switches: []
        };

        const directions = [
            {x: pos.x + 1, y: pos.y}, {x: pos.x - 1, y: pos.y},
            {x: pos.x, y: pos.y + 1}, {x: pos.x, y: pos.y - 1}
        ];

        if (piece.type === "Scarab" && piece.owner===this.currActivePlayer.playerId) {
            possibleActions.switches.push(this.board.getSphinxByOwner(this.currActivePlayer.playerId));
            possibleActions.switches.push(this.board.getPharaohByOwner(this.currActivePlayer.playerId));
        }

        directions.forEach(targetPos => {
            if (targetPos.x >= 0 && targetPos.x < Board.GRID_LEN &&
                targetPos.y >= 0 && targetPos.y < Board.GRID_LEN) {
                try {
                    this.actionValidator.validate({
                        method: "move",
                        args: { playerId: this._currActivePlayer.playerId, piece: piece.toDTO(), from: pos, to: targetPos }
                    });
                    possibleActions.moves.push(targetPos);
                } catch (e) {
                    /* nothing */
                }
            }
        });

        return possibleActions;
    }


    isRunning() {
        return this._state === GameState.RUNNING;
    }

    isFinished() {
        return this._state === GameState.GAME_OVER || this._state === GameState.DRAW;
    }

    isRated(){
        return this._mode===GameMode.MULTIPLAYER;
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
     * @param targetType
     * @returns {boolean}
     */
    playerCanSwap(player,targetType) {
        return this.isRunning() && this._playersSwapCooldowns[player.playerId][targetType] <= 0;
    }


    nextTurn() {
        if (this.isFinished()) {
            return;
        }
        this.actionTimer._stop();

        this._currActivePlayer.socket.emit("end-turn", {});

        const activeId = this._currActivePlayer.playerId;
        if (this._playersSwapCooldowns[activeId]["Sphinx"] > 0) this._playersSwapCooldowns[activeId]["Sphinx"]--;
        if (this._playersSwapCooldowns[activeId]["Pharaoh"] > 0) this._playersSwapCooldowns[activeId]["Pharaoh"]--;

        this._turnCount++;
        this._currActivePlayer = this._players[(this._turnCount-1)%2];

        this._playerInventories[this._currActivePlayer.playerId].unlockPendingPyramids();

        if (this._turnCount > Game.TURN_LIMIT) {
            this._state = GameState.DRAW;
        }

        this._currActivePlayer.socket.emit("start-turn", {
            playerId: this._currActivePlayer.playerId
        });

        if(!this._currActivePlayer.playerId.startsWith("ai#")){
            this.actionTimer.start();
        }



    }


    /**
     * @private
     *
     * @returns {path: Coord[]}
     */
    _processLaserHit() {
        const {path, destroyedPieces} = this.laserService.fireLaser(this.currActivePlayer);

        for (const piece of destroyedPieces) {
            if (piece.type === "Pharaoh") {
                this._state = GameState.GAME_OVER;
                if (this._winner !== null) {
                    this._state = GameState.DRAW;
                    this._winner = null;
                } else {
                    this._winner= this.players.find(player =>
                        player.playerId !== piece.owner
                    );
                }
            } else {
                if (piece.type === "Pyramid") {
                    const opponent = this.players.find(player => player.playerId !== piece.owner);
                    if (opponent) {
                        this._playerInventories[opponent.playerId].pushLockedPyramid();
                    }
                }
                this.board.removePiece({x:piece.x, y:piece.y});
            }
        }

        let grid = null;
        if (destroyedPieces.length>0) {
            grid = this.board.toDTO().grid;
        }

        return { path, grid};
    }

    onPlayerAction(action) {
        this.actionValidator.validate(action);

        this.ACTIONS[action.method](action.args);

        this._totalMoves++;
        let laserPath;
        if (action.method !== "switch" || action.args.piece2.type !== "Sphinx") {
            laserPath = this._processLaserHit().path;
        }

        const result = {};
        result.grid = this.board.toDTO().grid;
        result.laserPath = laserPath ?? undefined;

        const currInactivePlayer = this._players[this._turnCount%2];
        currInactivePlayer.socket.emit("opponent-action", {
            ...action, // other player needs to know which action happened
            result,
        });

        const currentTurnCount = this._turnCount;

        let spectatorSocket = this._currActivePlayer.socket;

        if (this._currActivePlayer.playerId.startsWith("ai#") || this._currActivePlayer.constructor.name === "Bot") {
            spectatorSocket = currInactivePlayer.socket;
        }

        if(spectatorSocket){

            spectatorSocket.once("animation-complete", () => {

                if (this._turnCount === currentTurnCount) {
                    this.nextTurn();
                }
            });

            setTimeout(() => {
                if (this._turnCount === currentTurnCount) {
                    console.log("[Serveur] Forçage du tour (timeout animation)");
                    this.nextTurn();
                }
            }, 5000);
        }
        else{
            this.nextTurn();
        }



        if (this.isFinished()) {
            this.onGameOver();
        }

        return result;
    }

    /**
     * @param {Player} player The player who forfeited the game
     */
    onPlayerForfeit(player) {
        if (this.mode === GameMode.LOCAL_MULTIPLAYER) {
            this._state = GameState.DRAW;
            this._winner = null;
        } else {
            const opponent = this.players.find(otherPlayer => otherPlayer.playerId !== player.playerId);
            this._state = GameState.GAME_OVER;
            this._winner = opponent;
        }

        // DEBUG::
        console.log(`Player of id '${player.playerId}' forfeited the game of id: '${this._gameId}'`);

        this.onGameOver();
        return;
    }

    /**
     * @private
     */
    _summarize() {
        if (this.state === GameState.DRAW) {
            const player1 = this._players[0];
            const player2 = this._players[1];

            const eloComputation = computeEloOnDraw(
                player1.playerId,
                player1.profile.elo,

                player2.playerId,
                player2.profile.elo,
            );

            return {
                player1Id: player1.playerId,
                player2Id: player2.playerId,

                totalMoves: this._totalMoves,

                userIds: [player1.userId, player2.userId],
                usernames: {
                    [player1.playerId]: player1.profile?.username || "Joueur 1", //FOR HISTORY
                    [player2.playerId]: player2.profile?.username || "Joueur 2",
                },

                users: {
                    [player1.playerId]: player1.userId,
                    [player2.playerId]: player2.userId,
                },
                results: {
                    [player1.playerId]: eloComputation[player1.playerId],
                    [player2.playerId]: eloComputation[player2.playerId],
                },
                statsUpdates: {
                    [player1.playerId]: {drew: true, newELO: eloComputation[player1.playerId].newELO},
                    [player2.playerId]: {drew: true, newELO: eloComputation[player2.playerId].newELO},
                },
            };
        }

        const winner = this._winner;
        const loser = this.players.find(player => player.playerId !== this._winner.playerId);

        const eloComputation = computeEloWithWinStreak(
            winner.playerId,
            winner.profile.elo,

            loser.playerId,
            loser.profile.elo,

            winner.profile.liveWinStreak,
        );

        return {
            winnerId: winner.playerId,
            loserId: loser.playerId,

            totalMoves: this._totalMoves,

            userIds: [winner.userId, loser.userId],
            usernames: {
                [winner.playerId]: winner.profile?.username, //FOR HISTORY
                [loser.playerId]: loser.profile?.username,
            },
            users: {
                [winner.playerId]: winner.userId,
                [loser.playerId]: loser.userId,
            },
            results: {
                [winner.playerId]: eloComputation[winner.playerId],
                [loser.playerId]: eloComputation[loser.playerId],
            },
            statsUpdates: {
                [winner.playerId]: {won: true, newELO: eloComputation[winner.playerId].newELO},
                [loser.playerId]: {lost: true, newELO: eloComputation[loser.playerId].newELO},
            },
        };
    }

    onGameOver() {
        const { GamesManager } = require("../GamesManager")

        const summary = this._summarize();

        for (const player of this.players) {
            if (player.socket) {
                player.socket.emit("game-over", {
                    state: this._state,
                    winnerId: this._winner?.playerId,
                    rating: summary.results[player.playerId] ?? null
                });
            }
        }

        if (this.isRated()) {
            GamesManager.endGame(this._gameId, summary,true);
        } else {
            GamesManager.endGame(this._gameId,summary,false);
        }
    }
}

module.exports = { Game, GameID, GameMode}
