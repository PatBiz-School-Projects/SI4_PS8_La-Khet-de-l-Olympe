import { Coord } from "./Coord.js";
import { Piece, PieceDTO } from "./Piece.js";


/**
 * @typedef {Object} CellDTO
 *
 * @property {number} x
 * @property {number} y
 * @property {PieceDTO|null} piece
 */
export const CellDTO = undefined;


export class Cell {
    /**
     * @private
     *
     * @param {number} x
     * @param {number} y
     * @param {Piece|null} content
     */
    constructor(x, y, content) {
        /** @private @type {Piece|null} */
        this._content = content;

        /** @private @type {number} */
        this._x = y;

        /** @private @type {number} */
        this._y = x;
    }


    /** @type {number} */
    get x() {
        return this._x;
    }

    /** @type {number} */
    get y() {
        return this._y;
    }

    /** @type {Coord} */
    get pos() {
        return {x: this._x, y: this._y};
    }

    /** @type {Piece|null} */
    get content() {
        return this._content;
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return this.content === null;
    }


    /**
     * @param {CellDTO} cellDTO
     *
     * @returns {Cell}
     */
    static fromDTO(cellDTO) {
        return new Cell(
            cellDTO.x,
            cellDTO.y,
            cellDTO.piece? Piece.fromDTO(cellDTO.piece) : null,
        );
    }

    /**
     * @returns {CellDTO}
     */
    toDTO() {
        return {
            x: this._x,
            y: this._y,
            piece: this._content?.toDTO(),
        };
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
