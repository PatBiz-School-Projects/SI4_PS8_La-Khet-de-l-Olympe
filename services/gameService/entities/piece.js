export const Dir = Object.freeze({
    N: "N",
    E: "E",
    S: "S",
    W: "W",
});

const DIR_ORDER = [Dir.N, Dir.E, Dir.S, Dir.W];

function rotateTurns(currentDirection, turns) {
    const i = DIR_ORDER.indexOf(currentDirection);
    if (i === -1) throw new Error("Direction invalide");
    const t = ((turns % 4) + 4) % 4;
    return DIR_ORDER[(i + t) % 4];
}
function getLocalImpactSide(globalDir) {
    const orientationTurns = DIR_ORDER.indexOf(this.orientation);
    return rotateTurns(globalDir, -orientationTurns);
}

function getGlobalDirection(localDir) {
    const orientationTurns = DIR_ORDER.indexOf(this.orientation);
    return rotateTurns(localDir, orientationTurns);
}


export class LaserImpact {
    static reflect(outDir) { return { type: "reflect", outDir }; }
    static absorb() { return { type: "absorb" }; }
    static destroy() { return { type: "destroy" }; } // destroy la pièce
}

class Piece {
    constructor(owner, x, y, orientation, image) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.orientation = orientation;
        this.image = image;
    }

    canRotate() { return false; }
    canMove() { return false; }
    canReflect() { return false; }

    rotate(turns) { throw new Error("This piece cannot rotate."); }
    move(x, y) { throw new Error("This piece cannot move."); }

    onLaserHit(laserDirGlobal) {
        return LaserImpact.destroy();
    }
}

class RotatePiece extends Piece {
    canRotate() { return true; }

    rotate90() { return this.rotate(1); }

    rotate(turns) {
        this.orientation = rotateTurns(this.orientation, turns);
        return this.orientation;
    }
}

class MoveablePiece extends Piece {
    canMove() { return true; }

    move(x, y) {
        this.x = x;
        this.y = y;
        return { x, y };
    }
}

class ReflectivePiece extends Piece {
    canReflect() { return true; }

    constructor(owner, x, y, orientation, image) {
        super(owner, x, y, orientation, image);
        this.reflectiveSides = this.buildReflectiveSides();
    }

    buildReflectiveSides() { // par défaut si c'est pas dit c'est destroy
        throw new Error("Must be implemented");
    }

    onLaserHit(laserDirectionGlobal) {
        const impactSide = getLocalImpactSide(laserDirectionGlobal); // la direction globale d'où vient ke laser
        const rule = this.reflectiveSides[impactSide] ?? { action: "destroy" }; // l'action lié au laser venant de cette direction

        if (rule.action === "reflect") {
            return LaserImpact.reflect(
                getGlobalDirection(rule.outRel) // convertit la direction relative de la pièce en direction globale
            );
        }

        return rule.action === "absorb" ? LaserImpact.absorb() : LaserImpact.destroy();
    }

}

export class Pharao extends Piece {
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"phararon.png");
    }
}

export class Pyramid extends MoveablePiece,RotatePiece,ReflectivePiece {
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"pyramid.jpg");
    }
    buildReflectiveSides() {
        
    }
}

export class Scarab extends ReflectivePiece,MoveablePiece,RotatePiece {
    buildFacesRel() {
        return {
            [Dir.N]: { action: "reflect", outRel: Dir.E },
            [Dir.E]: { action: "reflect", outRel: Dir.N },
            [Dir.S]: { action: "reflect", outRel: Dir.W },
            [Dir.W]: { action: "reflect", outRel: Dir.S },
        };
    }

    changeSides(){} // à implémenter + tard
}

export class Anubis extends ReflectivePiece,MoveablePiece,RotatePiece{
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"anubis.png");
    }
    buildFacesRel() {
        return {
            [Dir.N]: { action: "absorb"}
        }
    }
}

export class Sphinx extends Piece{
    constructor(owner,x,y,orientation) {
        super(owner,x,y,orientation,"sphinx.png");
    }
    hitLaser(){} // à implémenter
}