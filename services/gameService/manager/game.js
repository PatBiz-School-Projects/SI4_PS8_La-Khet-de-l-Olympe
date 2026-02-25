const { Board } = require("../entities/board");
const { Piece } = require("../entities/piece");
const LaserService = require("./laserService");


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
    constructor(players){
        this.board = new Board();
        this.laserService = new LaserService(this.board);

        this.players = players;

        this.state = GameState.RUNNING;
        this.turnCount = 1;
        this.currActivePlayer = players[0];
        this.winner = null;

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


    isRunning() {
        return this.state === GameState.RUNNING;
    }

    isFinished() {
        return this.state === GameState.GAME_OVER || this.state === GameState.DRAW;
    }

    playerCanPlay(player) {
        return this.isRunning() && player === this.currActivePlayer;
    }

    nextTurn() {
        this.turnCount++;
        this.currActivePlayer = this.players[(this.turnCount-1)%2];
    }

    processLaserHit() {
        const {path, destroyedPieces} = this.laserService.fireLaser(this.currActivePlayer);

        for (const piece of destroyedPieces) {
            if(piece.type === "Pharaoh"){
                this.state = GameState.GAME_OVER;
                if (this.winner !== null) {
                    this.state = GameState.DRAW;
                    this.winner = null;
                } else if (piece.owner !== this.currActivePlayer) {
                    this.winner = this.currActivePlayer;
                } else {
                    this.winner = piece.owner;
                }
            } else {
                if (piece.type === "Pyramid" && piece.owner !== this.currActivePlayer) {
                    // TODO : Adding the pyramid into the inventory of the current player
                } else {
                    this.board.removePiece(piece.x, piece.y);
                }
            }
        }

        return { path };
    }
}

module.exports = { Game }
