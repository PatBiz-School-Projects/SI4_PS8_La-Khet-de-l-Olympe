const { PlayerID } = require("../Player");

const { Board } = require("../entities/board");
const { Inventory } = require("../entities/inventory");


const AIActionGenerator = {
    move: (playerId, piece, from, to) => ({
        method: "move",
        args: {
            playerId,
            piece: piece.toDTO(),
            from,
            to,
        },
    }),
    place: (playerId, piece, pos) => ({
        method: "place",
        args: {
            playerId,
            piece: piece.toDTO(),
            pos,
        },
    }),
    rotate: (playerId, piece, pos, rotation) => ({
        method: "rotate",
        args: {
            playerId,
            piece: piece.toDTO(),
            pos,
            rotation,
        },
    }),
    switch: (playerId, piece1, pos1, piece2, pos2) => ({
        method: "switch",
        args: {
            playerId,
            piece1: piece1.toDTO(),
            pos1,
            piece2: piece2.toDTO(),
            pos2,
        },
    }),
}


class AiService {
    constructor(playerId, board, inventory) {
        /** @private @type {PlayerID} */
        this._playerId = playerId;

        /** @private @type {Board} */
        this._board = board;

        /** @private @type {Inventory} */
        this._inventory = inventory;

        this.moveValidator = new MoveValidator(this._board);
    }

    getLegalMoves(){
        const legalMoves = [];
        for (let x=0; x<Board.GRID_LEN; x++) {
            for (let y=0; y<Board.GRID_LEN; y++) {
                if (
                    this._board.hasPieceAt({x, y})
                    && this._board.getPieceAt({x, y}).owner === this._playerId
                ) {
                    this.addOrthogonalMoves(cell, legalMoves);
                    this.addPossibleRotations(cell, legalMoves);
                    if (cell.piece.type==="Scarab") {
                        this.addPossibleSwitches(cell,legalMoves);
                    }
                } else {
                    this.addPyramidsMoveFromReserve({x, y}, legalMoves);
                }
            }
        }

        return legalMoves;
    }

    addOrthogonalMoves(from, legalMoves){
        const directions = [{dx:1, dy:0}, {dx:-1, dy:0}, {dx:0, dy:1}, {dx:0, dy:-1}];
        directions.forEach(d => {
            const to = { x: from.x + d.dx, y: from.y + d.dy };
            if (to.x >= 0 && to.x < 10 && to.y >= 0 && to.y < 10) {
                if (!this._board.hasPieceAt(to)) {
                    legalMoves.push(
                        AIActionGenerator.move(this._playerId, this._board.getPieceAt(from), from, to)
                    );
                }
            }
        });
    }

    addPossibleRotations(from, legalMoves) {
        legalMoves.push(
            AIActionGenerator.rotate(this._playerId, this._board.getPieceAt(from), from, "right")
        );
        legalMoves.push(
            AIActionGenerator.rotate(this._playerId, this._board.getPieceAt(from), from, "right")
        );
    }

    addPyramidsMoveFromReserve(from,legalMoves){
        if (!this._inventory.isEmpty()) {
            legalMoves.push(
                AIActionGenerator.place(this._playerId, this._board.getPieceAt(from), from)
            );
            legalMoves.push(
                AIActionGenerator.place(this._playerId, this._board.getPieceAt(from), from)
            );
        }
    }

    addPossibleSwitches(pos,legalMoves){
        const sphinx = this._board.getSphinxByOwner(this._playerId);
        const pharaoh = this._board.getPharaohByOwner(this._playerId);
        const toSphinx={
            x:sphinx.x,
            y:sphinx.y
        }
        const toPharaoh = {
            x:pharaoh.x,
            y:pharaoh.y
        }
        legalMoves.push(
            AIActionGenerator.switch(this._playerId, this._board.getPieceAt(pos), pos, this._board.getPieceAt(toSphinx), toSphinx)
        );
        legalMoves.push(
            AIActionGenerator.switch(this._playerId, this._board.getPieceAt(pos), pos, this._board.getPieceAt(toPharaoh), toPharaoh)
        );
    }

    computeNextMove() {
        const legalMoves = this.getLegalMoves();
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
}

module.exports = { AiService };
