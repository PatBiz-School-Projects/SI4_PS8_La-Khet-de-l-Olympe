const { Game } = require("./game");
const { Board } = require("../entities/board");
const { Piece } = require("../entities/piece");
const { Player } = require("../Player");

const { PlayersManager } = require("../PlayersManager");


class ActionValidationError extends Error {}

class ActionValidator {
    constructor(game) {
        /** @type {Game} */
        this.game = game;

        /** @type {Player[]} */
        this.players = game.players;

        /** @type {Board} */
        this.board = game.board;
    }

    /**
     * @param {unknown} action
     *
     * @throws {ActionValidationError} if the action is invalid
     */
    validate(action) {
        switch (action.method) {
            case "move":
                return this._validateMove(action.args);
            case "place":
                return this._validatePlace(action.args);
            case "rotate":
                return this._validateRotate(action.args);
            case "switch":
                return this._validateSwitch(action.args);
            default:
                throw new ActionValidationError(`Unknown action '${action.method}'`);
        }
    }


    _validateMove({playerId, piece, from, to}) {
        // DEBUG::
        console.log("Validating movement of piece: ", piece, "from:", from, "to:", to);

        if (!playerId) {
            throw new ActionValidationError(`Missing 'playerId' argument`);
        }
        if (!piece) {
            throw new ActionValidationError(`Missing 'piece' argument`);
        }
        if (!from) {
            throw new ActionValidationError(`Missing 'from' argument`);
        }
        if (!to) {
            throw new ActionValidationError(`Missing 'to' argument`);
        }

        const player = PlayersManager.getPlayerById(playerId);
        if (!this.game.playerCanPlay(player)) {
            throw new ActionValidationError(`Player of id=${player.id} cannot play`);
        }

        piece = Piece.fromDTO(piece);
        if (!piece.equals(this.board.getPieceAt(from))) {
            throw new ActionValidationError(`The given piece differs from the piece at its position`);
        }
        // TODO : Uncomment once the owner truly corresponds to the playerId
        // if (piece.owner !== playerId) {
        //     throw new ActionValidationError(`The player doesn't own the piece to move`);
        // }
        if (!piece.canMove()) {
            throw new ActionValidationError(`The piece to move cannot move`);
        }

        const square = x => x*x;
        const squaredMoveDist = square(to.x - from.x) + square(to.y - from.y);
        if (squaredMoveDist !== 1) {
            // NOTE : Currently we are supposing that if a piece can move then it can only move in + shape.
            throw new ActionValidationError(`Moving piece too far`);
        }
    }

    _validatePlace({playerId, piece, pos}) {
        // DEBUG::
        console.log("Validating placement of piece:", piece, "at:", pos);

        if (!playerId) {
            throw new ActionValidationError(`Missing 'playerId' argument`);
        }
        if (!piece) {
            throw new ActionValidationError(`Missing 'piece' argument`);
        }
        if (!pos) {
            throw new ActionValidationError(`Missing 'pos' argument`);
        }

        const player = PlayersManager.getPlayerById(playerId);
        if (!this.game.playerCanPlay(player)) {
            throw new ActionValidationError(`Player of id=${player.id} cannot play`);
        }

        piece = Piec
        // TODO : Uncomment once the owner truly correseponds to the playerId.fromDTO(piece);
        // if (piece.owner !== playerId) {
        //     throw new ActionValidationError(`The player doesn't own the piece to place`);
        // }
        if (piece.type !== "Pyramid") {
            // NOTE : Currently we are supposing that the player can only place pyramids.
            throw new ActionValidationError(`The piece to place isn't a pyramid`);
        }

        if (this.board.hasPieceAt(pos)) {
            throw new ActionValidationError(`A piece already occupies the given position`);
        }

        // TODO : Assert that the player inventory isn't Check if the player inventory is emptyempty (once an inventory is implemented) :
        if (false) {
            throw new ActionValidationError(`Player's inventory is empty`);
        }

        const orthogonalNeighbourPositions = [
            {x:pos.x+1, y:pos.y},
            {x:pos.x, y:pos.y+1},
            {x:pos.x-1, y:pos.y},
            {x:pos.x, y:pos.y-1},
        ];
        for (const neighbourPos of orthogonalNeighbourPositions) {
            if (this.board.hasPieceAt(neighbourPos)) {
                const neighbourPiece = this.getPieceAt(neighbourPos);
                if (neighbourPiece.type === "Sphinx") {
                    throw new ActionValidationError(`Cannot place a pyramid orthogonally next to a sphinx`);
                }
                if (neighbourPiece.type === "Pharaoh" && neighbourPiece.owner === playerId) {
                    throw new ActionValidationError(`Cannot place a pyramid orthogonally next to your pharaoh`);
                }
            }
        }
    }

    _validateRotate({playerId, piece, pos, rotation}) {
        // DEBUG::
        console.log("Validating rotation of piece:", piece, "at:", pos, "to the", rotation);


        if (!playerId) {
            throw new ActionValidationError(`Missing 'playerId' argument`);
        }
        if (!piece) {
            throw new ActionValidationError(`Missing 'piece' argument`);
        }
        if (!pos) {
            throw new ActionValidationError(`Missing 'pos' argument`);
        }
        if (!rotation) {
            throw new ActionValidationError(`Missing 'rotation' argument`);
        }

        const player = PlayersManager.getPlayerById(playerId);
        if (!this.game.playerCanPlay(player)) {
            throw new ActionValidationError(`Player of id=${player.id} cannot play`);
        }

        piece = Piece.fromDTO(piece);
        if (!piece.equals(this.board.getPieceAt(pos))) {
            throw new ActionValidationError(`The given piece differs from the piece at its position`);
        }
        // TODO : Uncomment once the owner truly corresponds to the playerId
        // if (piece.owner !== playerId) {
        //     throw new ActionValidationError(`The player doesn't own the piece to rotate`);
        // }
        if (!piece.canRotate()) {
            throw new ActionValidationError(`The piece to rotate cannot rotate`);
        }
    }

    _validateSwitch({playerId, piece1, pos1, piece2, pos2}) {
        // DEBUG::
        console.log("Validating switch of piece: ", piece1, "at:", pos1, "with piece:", piece2, "at: ", pos2);

        if (!playerId) {
            throw new ActionValidationError(`Missing 'playerId' argument`);
        }
        if (!piece1) {
            throw new ActionValidationError(`Missing 'piece1' argument`);
        }
        if (!pos1) {
            throw new ActionValidationError(`Missing 'pos1' argument`);
        }
        if (!piece2) {
            throw new ActionValidationError(`Missing 'piece2' argument`);
        }
        if (!pos2) {
            throw new ActionValidationError(`Missing 'pos2' argument`);
        }

        const player = PlayersManager.getPlayerById(playerId);
        if (!this.game.playerCanPlay(player)) {
            throw new ActionValidationError(`Player of id=${player.id} cannot play`);
        }
        if (!this.game.playerCanSwap(player)) {
            throw new ActionValidationError(`Player of id=${player.id} cannot swap`);
        }

        piece1 = Piece.fromDTO(piece1);
        if (!piece1.equals(this.board.getPieceAt(pos1))) {
            throw new ActionValidationError(`The 1st given piece differs from the piece at its position`);
        }
        // TODO : Uncomment once the owner truly corresponds to the playerId
        // if (piece1.owner !== playerId) {
        //     throw new ActionValidationError(`The player doesn't own the 1st piece to swap`);
        // }
        if (piece1.type !== "Scarab") {
            throw new ActionValidationError(`The 1st piece to swap isn't a scarab`);
        }

        piece2 = Piece.fromDTO(piece2);
        if (!piece2.equals(this.board.getPieceAt(pos2))) {
            throw new ActionValidationError(`The 2nd given piece differs from the piece at its position`);
        }
        // TODO : Uncomment once the owner truly corresponds to the playerId
        // if (piece2.owner !== playerId) {
        //     throw new ActionValidationError(`The player doesn't own the 2nd piece to swap`);
        // }
        if (piece2.type !== "Sphinx" && piece2.type !== "Pharaoh") {
            throw new ActionValidationError(`The 2nd piece to swap isn't a sphinx nor a pharaoh`);
        }
    }
}

module.exports = { ActionValidator };
