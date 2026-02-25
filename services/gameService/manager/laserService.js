const DIRECTIONS =  {
    "N": {dx:0,dy:-1},
    "S": {dx:0,dy:1},
    "E": {dx:1,dy:0},
    "W": {dx:-1,dy:0},

}

class LaserService {
    constructor(board) {
        this.board = board;
    }

    fireLaser(currentPlayer) {
        const path = [];
        const sphinx = this.board.getSphinxByOwner(currentPlayer);

        let laserPos = {x: sphinx.x, y: sphinx.y}; // fire the laser from the sphinx
        let laserDir = sphinx.orientation;

        const destroyedPieces = [];

        path.push(laserPos);
        while (
            0<=laserPos.x && laserPos.x<Board.GRID_LEN
            && 0<=laserPos.y && laserPos.y<Board.GRID_LEN
        ) {
            const variation = DIRECTIONS[laserDir];

            const laserPos = {
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
                        case "reflect":
                            laserDir = impactReaction.outDir;
                            path.push({
                                ...laserPos,
                                hit:"reflected",
                            });

                        case "absorb":
                            path.push({
                                ...laserPos,
                                hit:"absorbed",
                            });

                        case "destroy":
                            destroyedPieces.push(piece);
                            path.push({
                                ...laserPos,
                                hit:"destroyed",
                                piece:piece.type,
                            });
                    }
                } else {
                    path.push(laserPos);
                }
            }
        }

        return {path, destroyedPieces};
    }
}

module.exports = LaserService;