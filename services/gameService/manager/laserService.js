const DIRECTIONS =  {
    "N": {dx:0,dy:-1},
    "S": {dx:0,dy:1},
    "E": {dx:1,dy:0},
    "W": {dx:-1,dy:0},

}
const {checkLaserImpact} = require("gameState");
class LaserService{
    constructor(board){
        this.board = board;
    }

    fire(currentPlayer){
        const path = [];
        const sphinx = this.board.getSphinx(currentPlayer);
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
                    const impact = piece.onLaserHit(); //to implement for every pieces
                    if(impact.type==="reflect"){
                        orientation = impact.orientation;
                    }
                    else if(impact.type==="absorb"){
                        path.push({x:newX.x,y:newY,hit:"absorbed"});
                    }
                    else if(impact.type==="destroy"){
                        //remove a piece
                        checkLaserImpact(piece);
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