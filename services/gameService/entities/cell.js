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


    /**
     * @deprecated This getter is deprecated & will be removed. Use {@link isEmpty()} instead.
     *
     * @type {boolean}
     */
    get isAvailabe() {
        return this.isEmpty()
    }

    /**
     * @deprecated This method is deprecated & will be removed. Use {@link put()} instead.
     *
     * @param {Piece} piece
     */
    addPiece(piece) {
        this.put(piece);
    }

    /**
     * @deprecated This method is deprecated & will be removed. Use {@link empty()} instead.
     */
    removePiece() {
        this.empty();
    }

    /**
     * @deprecated This method is deprecated & will be removed. Use {@link content} getter instead.
     *
     * @returns {Piece|null}
     */
    getPiece(){
        return this.content;
    }
}

module.exports = { Cell, CellDTO }
