const {removePiece} = require("./boardManager");


class Game {
    constructor(players = [1,2],boardManager,laserService){//not sure
        this.players = players;
        this.turnIndex = 0; // 0 pour le 1 et 1 pour le 2
        this.turnCount = 1;
        this.status = gameStatus.RUNNING;
        this.winner=null;
        this.boardManager = boardManager;
        this.laserService = laserService;
    }

    getCurrentPlayer() {
        return this.players[this.turnIndex];
    }

    isPlayersTurn(pieceOwner){
        console.log(this.getCurrentPlayer());
        return this.status===gameStatus.RUNNING && pieceOwner===this.getCurrentPlayer();
    }

    addTurn(){
        this.turnIndex = 1 - this.turnIndex
        if(this.turnIndex===1)this.turnCount++;
    }

    isGameFinished(){
        return this.status===gameStatus.GAME_OVER||this.status===gameStatus.DRAW;
    }

    proceedLaserHit(){
        const {path,destroyedPieces} = this.laserService.fireLaser(this.getCurrentPlayer());
        destroyedPieces.forEach(piece => {
            this.handleImpact(piece);
        })

        return {
            path : path,
        };
    }

    handleImpact(piece){
        if(piece.type==="Pharaoh"){
            this.status=gameStatus.GAME_OVER;
            if(this.winner!=null){
                this.status=gameStatus.DRAW;
                this.winner=null;
            }
            else if(piece.owner!==this.getCurrentPlayer()){
                this.winner=this.getCurrentPlayer();
            }
            else{
                this.winner=piece.owner;
            }

        }
        else{
            if(piece.type==="Pyramid" && piece.owner!==this.getCurrentPlayer()){
                //add into the box of current Player
            }
            else{
                this.boardManager.removePiece(piece.x,piece.y);
            }
        }
    }

    getGameStatus(){
        return this.status;
    }
}

const gameStatus ={
    RUNNING:"RUNNING",
    GAME_OVER:"GAME_OVER",
    DRAW : "DRAW",
    PAUSED:"PAUSED"
}

module.exports = Game;