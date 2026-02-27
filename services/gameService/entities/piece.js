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
 * @property {number} owner
 * @property {string} type
 * @property {PieceOrientation} orientation
 */
const PieceDTO = undefined;


/**
 * @abstract
 */
class Piece {
    constructor(type, owner, orientation) {
        this.type = type;
        this.owner = owner;
        this.orientation = orientation;
    }

    /**
     * @param {PieceDTO} pieceDTO
     *
     * @returns {Piece}
     * @throws When the piece's type is unknown 
     */
    static fromDTO(pieceDTO) {
        const PieceClass = PieceConstructors[pieceDTO.type];
        if(!PieceClass){
            throw new Error(`Unknown piece type: ${pieceDTO.type}`);
        }

        return new PieceClass(
            pieceDTO.type,
            pieceDTO.owner,
            pieceDTO.orientation
        );
    }

    /**
     * @returns {PieceDTO}
     */
    toDTO(){
        return{
            owner : this.owner,
            type : this.constructor.name,
            orientation : this.orientation
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
    // REVIEW : Useless (see note above `Reflective` mixin)
    canReflect() { return false; }

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

// REVIEW : Useless bcs the reflectiveness of a piece depends on the piece's type AND on the laser's impact
const Reflective = (Base) => class extends Base {
    canReflect() { return true; }
};


//
// Piece's Constructors
//


const PieceConstructors = {
    Pharaoh: class extends Piece {
        constructor(type, owner, orientation) {
            super(type, owner, orientation);
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

    Pyramid: class extends Reflective(Moveable(Rotatable(Piece))) {
        constructor(type, owner, orientation, isFromReserve) {
            super(type, owner, orientation);
            this.isFromReserve = isFromReserve;
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

    Scarab: class extends Reflective(Moveable(Rotatable(Piece))) {
        constructor(type, owner, orientation) {
            super(type, owner, orientation);
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

    Anubis: class extends Reflective(Moveable(Rotatable(Piece))) {
        constructor(type, owner,orientation) {
            super(type, owner, orientation);
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
        constructor(type, owner,orientation) {
            super(type, owner, orientation);
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
