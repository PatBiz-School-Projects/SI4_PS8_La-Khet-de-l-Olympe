const { PlayerID } = require("../Player");

const { Board } = require("../entities/board");
const { Inventory } = require("../entities/inventory");
const { Piece } = require("../entities/piece");


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


/**
 * @abstract
 */
class AI {
    constructor(playerId, board, inventory) {
        /** @private @type {PlayerID} */
        this._playerId = playerId;

        /** @private @type {Board} */
        this._board = board;

        /** @private @type {Inventory} */
        this._inventory = inventory;
    }

    /**
     * @protected
     */
    _getLegalActions() {
        const computeOrthogonalNeighbourPositions = (pos) => [
            {x:pos.x+1, y:pos.y},
            {x:pos.x, y:pos.y+1},
            {x:pos.x-1, y:pos.y},
            {x:pos.x, y:pos.y-1},
        ];

        const ret = [];

        let scarab, scarabPos;
        let sphinx, sphinxPos;
        let pharaoh, pharaohPos;

        for (let x=0; x<Board.GRID_LEN; x++) {
            for (let y=0; y<Board.GRID_LEN; y++) {
                const pos = {x, y};
                if (this._board.hasPieceAt(pos)) {
                    const piece = this._board.getPieceAt(pos);
                    if (piece.owner === this._playerId) {
                        if (piece.canMove()) {
                            computeOrthogonalNeighbourPositions(pos)
                                .filter(npos => !this._board.hasPieceAt(npos))
                                .forEach(npos => ret.push(AIActionGenerator.move(this._playerId, piece, pos, npos)));
                        }

                        if (piece.canRotate()) {
                            for (const rotation of ["left","right"]) {
                                ret.push(AIActionGenerator.rotate(this._playerId, piece, pos, rotation));
                            }
                        }

                        switch (piece.type) {
                            case "Scarab":
                                scarab = piece;
                                scarabPos = pos;
                                break;
                            case "Sphinx":
                                sphinx = piece;
                                sphinxPos = pos;
                                break;
                            case "Pharaoh":
                                pharaoh = piece;
                                pharaohPos = pos;
                                break;
                        }
                    }
                } else if (
                    !this._inventory.isEmpty()
                    && computeOrthogonalNeighbourPositions(pos).every(npos => {
                        if (this._board.hasPieceAt(npos)) {
                            const npiece = this._board.getPieceAt(npos);
                            if (npiece.type === "Sphinx") {
                                return false;
                            }
                            if (npiece.type === "Pharaoh" && npiece.owner === this._playerId) {
                                return false
                            }
                        }
                        return true;
                    })
                ) {
                    for (const orientation of ["N", "E", "W", "S"]) {
                        const piece = Piece.fromDTO({
                            type: "Pyramid",
                            owner: this._playerId,
                            color: this._inventory.color,
                            orientation: orientation,
                        });
                        ret.push(AIActionGenerator.place(this._playerId, piece, pos));
                    }
                }
            }
        }

        ret.push(AIActionGenerator.switch(this._playerId, scarab, scarabPos, sphinx, sphinxPos));
        ret.push(AIActionGenerator.switch(this._playerId, scarab, scarabPos, pharaoh, pharaohPos))

        return ret;
    }

    /**
     * @abstract
     */
    computeNextAction() { throw new Error("Not implemented"); }
}


class RandomAI extends AI {
    constructor(playerId, board, inventory) {
        super(playerId, board, inventory)
    }

    computeNextAction() {
        const legalActions = this._getLegalActions();
        return legalActions[Math.floor(Math.random() * legalActions.length)];
    }
}


class MiniMaxAI extends AI {
    // TODO : One day (once our whole game works)
}

module.exports = { RandomAI };
