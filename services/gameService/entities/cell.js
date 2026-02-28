const { Piece, PieceDTO } = require("./piece");


/**
 * @typedef {Object} CellDTO
 *
 * @property {number} x
 * @property {number} y
 * @property {PieceDTO|null} piece
 */
const CellDTO = undefined;


class Cell {
    constructor(x, y, content) {
        /** @private @type {number} */
        this._x = x;

        /** @private @type {number} */
        this._y = y;

        /** @private @type {Piece|null} */
        this._content = content;
    }

    /** @type {number} */
    get x() {
        return this._x;
    }

    /** @type {number} */
    get y() {
        return this._y;
    }

    /** @type {Piece|null} */
    get content() {
        return this._content;
    }

    /**
     * @returns {CellDTO}
     */
    toDTO(){
        return {
            x: this._x,
            y: this._y,
            piece: this._content?.toDTO(),
        };
    }

    isEmpty() {
        return this._content === null;
    }

    /**
     * Put a piece inside the cell.
     *
     * @param {Piece} piece
     */
    put(piece) {
        this._content = piece;
    }

    /**
     * Empty the cell.
     */
    empty() {
        this._content = null;
    }
}

module.exports = { Cell, CellDTO }
