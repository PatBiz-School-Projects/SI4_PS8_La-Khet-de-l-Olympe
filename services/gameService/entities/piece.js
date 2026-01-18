export const Dir = Object.freeze({
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

export class LaserImpact {
    static reflect(outDir) { return { type: "reflect", outDir }; }
    static absorb() { return { type: "absorb" }; }
    static destroy() { return { type: "destroy" }; }
}

class Piece {
    constructor(owner, x, y, orientation, image) {
        this.owner = owner;
        this.x = x;
        this.y = y;
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
    move(x, y) {
        this.x = x;
        this.y = y;
        return { x, y };
    }
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

export class Pharao extends Piece {
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"pharaon.png");
    }
}

export class Pyramid extends Reflective(Moveable(Rotatable(Piece))) {
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"pyramid.jpg");
    }
    buildReflectiveSides() {
        return {
            [Dir.N]: { action: "reflect", outRel: Dir.E },
            [Dir.E]: { action: "reflect", outRel: Dir.N },
        };
    }
}

export class Scarab extends Reflective(Moveable(Rotatable(Piece))) {
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"scarab.png");
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

export class Anubis extends Reflective(Moveable(Rotatable(Piece))) {
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"anubis.png");
    }
    buildReflectiveSides() {
        return {
            [Dir.N]: { action: "absorb" },
        };
    }
}

export class Sphinx extends Rotatable(Piece) {
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"sphinx.png");
    }
    hitLaser(){} // à implémenter
}
