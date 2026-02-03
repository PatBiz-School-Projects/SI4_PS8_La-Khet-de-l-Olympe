const DIRECTIONS =  {
    "N": {dx:0,dy:-1},
    "S": {dx:0,dy:1},
    "E": {dx:1,dy:0},
    "W": {dx:-1,dy:0},

}

class LaserService {
    constructor(board,gameService){ //not sure
        this.board = board;
        this.gameService = gameService;
    }

    fireLaser(currentPlayer){
        const path = [];
        const sphinx = this.board.getSphinxByOwner(currentPlayer);//to implement
        let x = sphinx.x;
        let y = sphinx.y;
        let orientation= sphinx.orientation;
        while(x>=0 && x<10 && y>=0 &&y<10){
            path.push({x:x,y:y});
            const variation = DIRECTIONS[orientation];
            const newX = x+variation.dx;
            const newY = y+variation.dy;
            if(newX>=0 && newX<10 && newY>=0 &&newY<10){
                const piece = this.board.grid[newY][newX].getPiece();
                if(piece){
                    const impact = piece.onLaserHit();
                    if(impact.type==="reflect"){
                        orientation = impact.outDir;
                    }
                    else if(impact.type==="absorb"){
                        path.push({x:newX.x,y:newY,hit:"absorbed"});
                    }
                    else if(impact.type==="destroy"){
                        this.gameService.checkLaserImpact(piece);
                        path.push({x:newX.x,y:newY,hit:"destroyed",piece:piece.constructor.name});
                    }
                }
            }
            x=newX;
            y=newY;

        }

        return path;

    }
}