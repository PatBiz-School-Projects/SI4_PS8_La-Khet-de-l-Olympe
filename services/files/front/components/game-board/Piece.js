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
 * @property {number} owner
 * @property {PieceType} type
 * @property {PieceOrientation} orientation
 */
export const PieceDTO = undefined;


export class Piece {
    constructor(owner, type, orientation) {
        /** @private @type {number} */
        this._owner = owner;

        /** @private @type {string} */
        this._type = type;

        /** @private @type {PieceOrientation} */
        this._orientation = orientation;
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

    /** @type {string} */
    get image() {
        return `/assets/${this._type.toLowerCase()}.png`;
    }


    static fromDTO(pieceDTO) {
        return new Piece(
            pieceDTO.owner,
            pieceDTO.type,
            pieceDTO.orientation,
        );
    }

    toDTO() {
        return {
            owner: this._owner,
            type: this._type,
            orientation: this._orientation,
        };
    }


    /**
     * @param {PieceOrientation} newOrientation
     */
    rotateTo(newOrientation) {
        this._orientation = newOrientation;
    }
}
