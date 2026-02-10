const DIRECTIONS =  {
    "N": {dx:0,dy:-1},
    "S": {dx:0,dy:1},
    "E": {dx:1,dy:0},
    "W": {dx:-1,dy:0},

}

class LaserService {
    constructor(board){ //not sure
        this.board = board;
    }

    fireLaser(currentPlayer){
        const path = [];
        const sphinx = this.board.getSphinxByOwner(currentPlayer);
        let x = sphinx.x;
        let y = sphinx.y;
        let orientation= sphinx.orientation;
        const pieceDestroyed = []
        path.push({x:x,y:y});
        while(x>=0 && x<10 && y>=0 &&y<10){
            const variation = DIRECTIONS[orientation];
            const newX = x+variation.dx;
            const newY = y+variation.dy;
            if(newX>=0 && newX<10 && newY>=0 &&newY<10){
                const piece = this.board.getPiece(newX,newY);
                if(piece){
                    const impact = piece.onLaserHit(orientation);
                    if(impact.type==="reflect"){
                        orientation = impact.outDir;
                        console.log(orientation);
                        path.push({x:newX,y:newY,hit:"reflected"});
                    }
                    else if(impact.type==="absorb"){
                        path.push({x:newX,y:newY,hit:"absorbed"});
                    }
                    else if(impact.type==="destroy"){
                        pieceDestroyed.push(piece);
                        path.push({x:newX,y:newY,hit:"destroyed",piece:piece.type});
                    }
                }
                else{
                    path.push({x:newX,y:newY});
                }
            }
            x=newX;
            y=newY;

        }

        return {path,pieceDestroyed};

    }
}

module.exports = LaserService;