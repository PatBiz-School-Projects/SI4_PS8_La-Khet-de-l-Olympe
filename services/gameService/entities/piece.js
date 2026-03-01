const { LaserDirection, LaserImpact } = require('./laser');


/**
 * @enum {typeof PieceOrientation[keyof typeof PieceOrientation]}
 */
const PieceOrientation = Object.freeze({
    N: "N",
    E: "E",
    S: "S",
    W: "W",
});


/**
 * @typedef {Object} PieceDTO
 *
 * @property {string} type
 * @property {number} owner
 * @property {"red"|"blue"} color
 * @property {PieceOrientation} orientation
 */
const PieceDTO = undefined;


/**
 * @abstract
 */
class Piece {
    constructor(type, owner, color, orientation) {
        this.type = type;
        this.owner = owner;
        this.color = color
        this.orientation = orientation;
    }

    /**
     * @param {PieceDTO} pieceDTO
     *
     * @returns {Piece}
     * @throws if the piece's type is unknown
     */
    static fromDTO(pieceDTO) {
        const PieceClass = PieceConstructors[pieceDTO.type];
        if(!PieceClass){
            throw new Error(`Unknown piece type: ${pieceDTO.type}`);
        }

        return new PieceClass(
            pieceDTO.type,
            pieceDTO.owner,
            pieceDTO.color,
            pieceDTO.orientation,
        );
    }

    /**
     * @returns {PieceDTO}
     */
    toDTO(){
        return{
            type: this.type,
            owner: this.owner,
            color: this.color,
            orientation: this.orientation
        }
    }

    /**
     * @param {unknown} other
     *
     * @returns {boolean}
     */
    equals(other) {
        if (this.constructor !== other.constructor) return false;
        if (this.type !== other.type) return false;
        if (this.owner !== other.owner) return false;
        if (this.orientation !== other.orientation) return false;
        return true;
    }

    /**
     * @abstract
     *
     * @param {LaserDirection} laserDir
     */
    onLaserHit(laserDir) {
        throw new Error("Not implemented");
    }

    canRotate() { return false; }
    canMove() { return false; }

    /**
     * @param {"left" | "right"} rotation
     */
    rotate(rotation) { throw new Error("This piece cannot rotate."); }
}


//
// Piece's Mixins
//


const Rotatable = (Base) => class extends Base {
    canRotate() { return true; }

    /**
     * @param {"left" | "right"} rotation
     */
    rotate(rotation) {
        const posMod = (dividend, divisor) => ((dividend % divisor) + divisor) % divisor;

        const ORDERED_ORIENTATIONS = [PieceOrientation.N, PieceOrientation.E, PieceOrientation.S, PieceOrientation.W];

        const currOrientationIdx = ORDERED_ORIENTATIONS.indexOf(this.orientation);
        switch (rotation) {
            case "left":
                this.orientation = ORDERED_ORIENTATIONS[
                    posMod(currOrientationIdx-1, ORDERED_ORIENTATIONS.length)
                ];
            case "right":
                this.orientation = ORDERED_ORIENTATIONS[
                    posMod(currOrientationIdx+1, ORDERED_ORIENTATIONS.length)
                ];
        }
    }
};

const Moveable = (Base) => class extends Base {
    canMove() { return true; }
};


//
// Piece's Constructors
//


const PieceConstructors = {
    Pharaoh: class extends Piece {
        constructor(type, owner, color, orientation) {
            super(type, owner, color, orientation);
        }

        /**
         * @override
         *
         * @param {LaserDirection} laserDir
         */
        onLaserHit(laserDir) {
            return LaserImpact.destroy();
        }
    },

    Pyramid: class extends Moveable(Rotatable(Piece)) {
        constructor(type, owner, color, orientation) {
            super(type, owner, color, orientation);
        }

        /**
         * @override
         *
         * @param {LaserDirection} laserDir
         */
        onLaserHit(laserDir) {
            const posMod = (dividend, divisor) => ((dividend % divisor) + divisor) % divisor;
            const ORDERED_ORIENTATIONS = [PieceOrientation.N, PieceOrientation.E, PieceOrientation.S, PieceOrientation.W];

            const laserDirIdx = ORDERED_ORIENTATIONS.indexOf(laserDir);

            const laserImpact = ORDERED_ORIENTATIONS[posMod(laserDirIdx + 2, ORDERED_ORIENTATIONS.length)]

            let reflectionMapping;
            switch (this.orientation) {
                case PieceOrientation.N :
                    // Reflective side: NE
                    reflectionMapping = {
                        [LaserDirection.N]: LaserDirection.E,
                        [LaserDirection.E]: LaserDirection.N,
                    };
                case PieceOrientation.E :
                    // Reflective side: SE
                    reflectionMapping = {
                        [LaserDirection.S]: LaserDirection.E,
                        [LaserDirection.E]: LaserDirection.S,
                    };
                case PieceOrientation.S :
                    // Reflective side: SW
                    reflectionMapping = {
                        [LaserDirection.S]: LaserDirection.W,
                        [LaserDirection.W]: LaserDirection.S,
                    };
                case PieceOrientation.W :
                    // Reflective side: NW
                    reflectionMapping = {
                        [LaserDirection.N]: LaserDirection.W,
                        [LaserDirection.W]: LaserDirection.N,
                    };
            }

            if (laserImpact in reflectionMapping) {
                return LaserImpact.reflect(reflectionMapping[laserImpact]);
            } else {
                return LaserImpact.destroy();
            }
        }
    },

    Scarab: class extends Moveable(Rotatable(Piece)) {
        constructor(type, owner, color, orientation) {
            super(type, owner, color, orientation);
        }

        /**
         * @override
         *
         * @param {LaserDirection} laserDir
         */
        onLaserHit(laserDir) {
            const posMod = (dividend, divisor) => ((dividend % divisor) + divisor) % divisor;
            const ORDERED_ORIENTATIONS = [PieceOrientation.N, PieceOrientation.E, PieceOrientation.S, PieceOrientation.W];

            const laserDirIdx = ORDERED_ORIENTATIONS.indexOf(laserDir);

            const laserImpact = ORDERED_ORIENTATIONS[posMod(laserDirIdx + 2, ORDERED_ORIENTATIONS.length)]

            let reflectionMapping1;
            let reflectionMapping2;
            switch (this.orientation) {
                case PieceOrientation.N :
                case PieceOrientation.S :
                    // Reflective side: NE & SW
                    reflectionMapping1 = {
                        [LaserDirection.N]: LaserDirection.E,
                        [LaserDirection.E]: LaserDirection.N,
                    };
                    reflectionMapping2 = {
                        [LaserDirection.S]: LaserDirection.W,
                        [LaserDirection.W]: LaserDirection.S,
                    };

                case PieceOrientation.E :
                case PieceOrientation.W :
                    // Reflective side: NW & SE
                    reflectionMapping1 = {
                        [LaserDirection.N]: LaserDirection.W,
                        [LaserDirection.W]: LaserDirection.N,
                    };
                    reflectionMapping2 = {
                        [LaserDirection.S]: LaserDirection.E,
                        [LaserDirection.E]: LaserDirection.S,
                    };
            }

            if (laserImpact in reflectionMapping1) {
                return LaserImpact.reflect(reflectionMapping1[laserImpact]);
            } else {
                return LaserImpact.reflect(reflectionMapping2[laserImpact]);
            }
        }
    },

    Anubis: class extends Moveable(Rotatable(Piece)) {
        constructor(type, owner, color, orientation) {
            super(type, owner, color, orientation);
        }

        /**
         * @override
         *
         * @param {LaserDirection} laserDir
         */
        onLaserHit(laserDir) {
            const posMod = (dividend, divisor) => ((dividend % divisor) + divisor) % divisor;
            const ORDERED_ORIENTATIONS = [PieceOrientation.N, PieceOrientation.E, PieceOrientation.S, PieceOrientation.W];

            const laserDirIdx = ORDERED_ORIENTATIONS.indexOf(laserDir);

            const laserImpact = ORDERED_ORIENTATIONS[posMod(laserDirIdx + 2, ORDERED_ORIENTATIONS.length)]

            if (this.orientation == laserImpact) {
                return LaserImpact.absorb();
            } else {
                return LaserImpact.destroy();
            }
        }
    },

    Sphinx: class extends Rotatable(Piece) {
        constructor(type, owner, color, orientation) {
            super(type, owner, color, orientation);
        }

        /**
         * @override
         *
         * @param {LaserDirection} laserDir
         */
        onLaserHit(laserDir) {
            return LaserImpact.absorb();
        }
    },
}


module.exports = {
    Piece,
    PieceDTO,
    PieceOrientation,

    /** @deprecated This alias is deprecated. Use {@link PieceOrientation}. */
    Dir: PieceOrientation,
};
