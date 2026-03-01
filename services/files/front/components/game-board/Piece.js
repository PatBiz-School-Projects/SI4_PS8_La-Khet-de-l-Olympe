/**
 * @enum {typeof PieceOrientation[keyof typeof PieceOrientation]}
 */
export const PieceOrientation = /** @type {const}*/ ({
    N: 'N',
    W: 'W',
    E: 'E',
    S: 'S',
});


/**
 * @enum {typeof PieceType[keyof typeof PieceType]}
 */
export const PieceType = /** @type {const}*/ ({
    Anubis: "Anubis",
    Pharaoh: "Pharaoh",
    Pyramid: "Pyramid",
    Scarab: "Scarab",
    Sphinx: "Sphinx",
});


/**
 * @typedef {Object} PieceDTO
 *
 * @property {PieceType} type
 * @property {number} owner
 * @property {"red"|"blue"} color
 * @property {PieceOrientation} orientation
 */
export const PieceDTO = undefined;


export class Piece {
    constructor(owner, type, orientation, color) {
        /** @private @type {number} */
        this._owner = owner;

        /** @private @type {string} */
        this._type = type;

        /** @private @type {PieceOrientation} */
        this._orientation = orientation;

        /** @private @type {"red"|"blue"} */
        this._color = color;
    }


    /** @type {number} */
    get owner() {
        return this._owner;
    }

    /** @type {string} */
    get type() {
        return this._type;
    }

    /** @type {PieceOrientation} */
    get orientation() {
        return this._orientation;
    }

    /** @type {"red"|"blue"} */
    get color() {
        return this._color;
    }

    /** @type {string} */
    get image() {
        return `/assets/${this._type.toLowerCase()}-${this._color}.png`;
    }


    static fromDTO(pieceDTO) {
        return new Piece(
            pieceDTO.owner,
            pieceDTO.type,
            pieceDTO.orientation,
            pieceDTO.color,
        );
    }

    toDTO() {
        return {
            owner: this._owner,
            type: this._type,
            orientation: this._orientation,
            color: this._color,
        };
    }


    /**
     * @param {PieceOrientation} newOrientation
     */
    rotateTo(newOrientation) {
        this._orientation = newOrientation;
    }
}
