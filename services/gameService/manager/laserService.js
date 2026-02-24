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

        let x = sphinx.x;
        let y = sphinx.y;

        let orientation = sphinx.orientation;

        const destroyedPieces = [];

        path.push({x, y});
        while (0<=x && x<10 && 0<=y && y<10) {
            const variation = DIRECTIONS[orientation];

            const newX = x + variation.dx;
            const newY = y + variation.dy;

            if (newX>=0 && newX<10 && newY>=0 && newY<10) {
                const piece = this.board.getPieceAt(newX, newY);
                if (piece) {
                    const impactReaction = piece.onLaserHit(orientation);
                    switch (impactReaction.type) {
                        case "reflect":
                            orientation = impactReaction.outDir;
                            path.push({
                                x:newX,
                                y:newY,
                                hit:"reflected",
                            });

                        case "absorb":
                            path.push({
                                x:newX,
                                y:newY,
                                hit:"absorbed",
                            });

                        case "destroy":
                            destroyedPieces.push(piece);
                            path.push({
                                x:newX,
                                y:newY,
                                hit:"destroyed",
                                piece:piece.type,
                            });
                    }
                } else {
                    path.push({x:newX, y:newY});
                }
            }

            x = newX;
            y = newY;
        }

        return {path, destroyedPieces};
    }
}

module.exports = LaserService;