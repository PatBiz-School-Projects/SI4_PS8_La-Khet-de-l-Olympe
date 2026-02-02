const Dir = Object.freeze({
    N: "N",
    E: "E",
    S: "S",
    W: "W",
});

const DIR_ORDER = [Dir.N, Dir.E, Dir.S, Dir.W];

function rotateTurns(dir, turns) {
    const i = DIR_ORDER.indexOf(dir);
    if (i === -1) throw new Error("Direction invalide");
    const t = ((turns % 4) + 4) % 4;
    return DIR_ORDER[(i + t) % 4];
}

const LaserImpact = require('./laser');


class Piece {
    constructor(owner,orientation, image) {
        this.owner = owner;
        this.orientation = orientation;
        this.image = image;
    }

    getLocalImpactSide(globalDir) {
        const turns = DIR_ORDER.indexOf(this.orientation);
        return rotateTurns(globalDir, -turns);
    }

    getGlobalDirection(localDir) {
        const turns = DIR_ORDER.indexOf(this.orientation);
        return rotateTurns(localDir, turns);
    }

    canRotate() { return false; }
    canMove() { return false; }
    canReflect() { return false; }

    rotate(turns) { throw new Error("This piece cannot rotate."); }
    move(x, y) { throw new Error("This piece cannot move."); }

    onLaserHit() {
        return LaserImpact.destroy();
    }
    toDTO(){
        return{
            owner : this.owner,
            type : this.constructor.name,
            orientation : this.orientation
        }
    }
}

const Rotatable = (Base) => class extends Base {
    canRotate() { return true; }
    rotate(turns) {
        this.orientation = rotateTurns(this.orientation, turns);
        return this.orientation;
    }
    rotate90() { return this.rotate(1); }
};

const Moveable = (Base) => class extends Base {
    canMove() { return true; }
};

const Reflective = (Base) => class extends Base {
    canReflect() { return true; }

    buildReflectiveSides() {
        throw new Error("Must be implemented");
    }

    onLaserHit(laserDirGlobal) {
        const impactLocal = this.getLocalImpactSide(laserDirGlobal); //
        const rules = this.buildReflectiveSides();
        const rule = rules[impactLocal] ?? { action: "destroy" };

        if (rule.action === "reflect") {
            return LaserImpact.reflect(this.getGlobalDirection(rule.outRel));
        }
        return rule.action === "absorb"
            ? LaserImpact.absorb()
            : LaserImpact.destroy();
    }
};

class Pharaoh extends Piece {
    constructor(owner,orientation) {
        super(owner,orientation,"pharaoh.png");
    }
}

class Pyramid extends Reflective(Moveable(Rotatable(Piece))) {
    constructor(owner,orientation,isFromReserve) {
        super(owner,orientation,"pyramid.jpg");
        this.isFromReserve = isFromReserve;
    }
    buildReflectiveSides() {
        return {
            [Dir.N]: { action: "reflect", outRel: Dir.E },
            [Dir.E]: { action: "reflect", outRel: Dir.N },
        };
    }
}

class Scarab extends Reflective(Moveable(Rotatable(Piece))) {
    constructor(owner,orientation) {
        super(owner,orientation,"scarab.png");
    }
    buildReflectiveSides() {
        return {
            [Dir.N]: { action: "reflect", outRel: Dir.E },
            [Dir.E]: { action: "reflect", outRel: Dir.N },
            [Dir.S]: { action: "reflect", outRel: Dir.W },
            [Dir.W]: { action: "reflect", outRel: Dir.S },
        };
    }
    changeSides(){} // à implémenter + tard
}

class Anubis extends Reflective(Moveable(Rotatable(Piece))) {
    constructor(owner,orientation) {
        super(owner,orientation,"anubis.png");
    }
    buildReflectiveSides() {
        return {
            [Dir.N]: { action: "absorb" },
        };
    }
}

class Sphinx extends Rotatable(Piece) {
    constructor(owner,orientation) {
        super(owner,orientation,"sphinx.png");
    }
    hitLaser(){
        return {
            originX: this.x,
            originY: this.y,
            direction: this.orientation,
        };
    }
}

module.exports = {Sphinx,Anubis,Scarab,Pyramid,Pharaoh,Dir,Piece};
