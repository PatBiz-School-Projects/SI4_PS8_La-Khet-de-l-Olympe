const { Board } = require("../entities/board");
const { LaserDirection } = require("../entities/laser");


const VECTORIZED_LASER_DIRECTIONS =  Object.freeze({ //need to see if it's correct
    [LaserDirection.N]: {dx:-1,dy:0},
    [LaserDirection.S]: {dx:1,dy:0},
    [LaserDirection.E]: {dx:0,dy:1},
    [LaserDirection.W]: {dx:0,dy:-1},
});


class LaserService {
    constructor(board) {
        this.board = board;
    }

    fireLaser(currentPlayer) {
        const path = [];
        const sphinx = this.board.getSphinxByOwner(currentPlayer.playerId);

        let laserPos = {x: sphinx.x, y: sphinx.y}; // fire the laser from the sphinx
        let laserDir = sphinx.orientation;

        const destroyedPieces = [];

        let laserActive = true;
        let safetyGuard = 0;

        path.push(laserPos);
        while (laserActive
            &&0<=laserPos.x && laserPos.x<Board.GRID_LEN
            && 0<=laserPos.y && laserPos.y<Board.GRID_LEN
        ) {
            safetyGuard++;
            if (safetyGuard > 100) {
                console.warn("Boucle infinie de laser détectée et stoppée !");
                break;
            }
            const variation = VECTORIZED_LASER_DIRECTIONS[laserDir];

            laserPos = {
                x: laserPos.x + variation.dx,
                y: laserPos.y + variation.dy,
            };

            if (
                laserPos.x>=0 && laserPos.x<Board.GRID_LEN
                && laserPos.y>=0 && laserPos.y<Board.GRID_LEN
            ) {
                if (this.board.hasPieceAt(laserPos)) {
                    const piece = this.board.getPieceAt(laserPos);
                    const impactReaction = piece.onLaserHit(laserDir);
                    switch (impactReaction.type) {
                        case "reflect": // cbon
                            laserDir = impactReaction.outDir;
                            path.push({
                                ...laserPos,
                                hit:"reflected",
                            });
                            break;

                        case "absorb":
                            path.push({
                                ...laserPos,
                                hit:"absorbed",
                            });
                            laserActive = false;
                            break;

                        case "destroy":
                            destroyedPieces.push({
                                ...laserPos,
                                type: piece.type,
                                owner:piece.owner,
                            });
                            path.push({
                                ...laserPos,
                                hit:"destroyed",
                                piece:piece.type,
                            });
                            if (piece.type === "Pharaoh") {
                                return { path, destroyedPieces };
                            }
                            break;
                    }
                } else {
                    path.push(laserPos);
                }
            }
        }

        return {path, destroyedPieces};
    }
}

module.exports = { LaserService };
