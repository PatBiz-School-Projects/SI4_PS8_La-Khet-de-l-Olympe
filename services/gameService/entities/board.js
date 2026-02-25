const { Cell } = require('./cell');
const { Piece } = require('./piece');

const StartingPositions = require('../manager/startingPositions');


class Board {
    static GRID_LEN = 10;

    constructor() {
        this.grid = [];

        for (let i = 0; i < Board.GRID_LEN; i++) {
            this.grid[i] = [];
            for (let j = 0; j < Board.GRID_LEN; j++) {
                this.grid[i][j] = new Cell(i, j, null);
            }
        }

        this.sphinxes = {};
    }

    init() {
        const sp = new StartingPositions(Board.GRID_LEN);
        sp.generateAndApply(this);

        // Finding and caching the sphinxes
        for (let x = 0; x < Board.GRID_LEN; x++) {
            for (let y = 0; y < Board.GRID_LEN; y++) {
                if (this.hasPieceAt({x, y})) {
                    const piece = this.getPieceAt({x, y});
                    if (piece.type === "Sphinx") {
                        this.sphinxes[piece.owner] = {
                            x: x, y: y, orientation: piece.orientation
                        };
                    }
                }
            }
        }
    }


    toDTO() {
        return {
            grid: this.grid.map(
                row => row.map(
                    cell => (
                        cell.toDTO()
                    )
                )
            )
        };
    }


    /**
     * @param {{x: number, y: number}} pos
     *
     * @returns {boolean}
     */
    hasPieceAt(pos) {
        return !this.grid[pos.x][pos.y].isEmpty();
    }

    /**
     * @param {{x: number, y: number}} pos
     *
     * @returns {Piece}
     * @throws When there is no piece at the given position
     */
    getPieceAt(pos) {
        const piece = this.grid[pos.x][pos.y].content;
        if (!piece) {
            throw new Error(`No piece at {x:${pos.x}, y:${pos.y}}`);
        }

        return piece;
    }

    getSphinxByOwner(owner) {
        return this.sphinxes[owner];
    }


    putPiece(piece, pos) {
        this.grid[pos.x][pos.y].put(piece);
    }
    addPiece(piece, pos) {
        this.putPiece(piece, pos);
    }

    emptyCell(pos) {
        this.grid[pos.x][pos.y].empty();
    }
    removePiece(pos) {
        this.emptyCell(pos);
    }

    ////////////////////////////////////////////////////////////////////////////
    // Actions

    // All actions should have been validated before calling the following methods

    movePiece(_piece, from, to) {
        const piece = this.getPieceAt(from);

        this.emptyCell(from);
        this.putPiece(piece, to);
    }

    placePiece(piece, pos) {
        // REVIEW : Shouldn't be needed as the action has been validated
        if (this.hasPieceAt(pos)) {
            throw new Error(`A piece is already at the desired position {x:${pos.x}, y:${pos.y}}`);
        }

        this.putPiece(piece, pos);
    }

    rotatePiece(_piece, pos, rotation) {
        const piece = this.getPieceAt(pos);

        piece.rotate(rotation);
    }

    switchPieces(piece1, pos1, piece2, pos2) {
        this.emptyCell(pos1);
        this.putPiece(piece2);

        this.emptyCell(pos2);
        this.putPiece(piece1);
    }
}

module.exports = { Board };
