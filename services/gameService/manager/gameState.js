const {removePiece} = require("./boardManager");


class GameState {
    constructor(players = [1,2]){
        this.players = players;
        this.turnIndex = 0; // 0 pour le 1 et 1 pour le 2
        this.turnCount = 1;
        this.status = gameStatus.RUNNING;
        this.winner=null;
    }

    getCurrentPlayer() {
        return this.players[this.turnIndex];
    }

    isPlayersTurn(pieceOwner){
        return this.status===gameStatus.RUNNING && pieceOwner===this.getCurrentPlayer();
    }

    addTurn(){
        this.turnIndex = 1 - this.turnIndex
        if(this.turnIndex===1)this.turnCount++;
    }

    isGameFinished(){
        return this.status===gameStatus.GAME_OVER;
    }

    checkLaserImpact(piece){
        if(piece.constructor.name==="Pharaoh"){
            this.status=gameStatus.GAME_OVER;
            if(piece.owner!==this.getCurrentPlayer()){
                this.winner=this.getCurrentPlayer();
            }
            //Draw case
            else{
                this.winner=piece.owner;
            }

        }
        else{
            if(piece.constructor.name==="Pyramid" && piece.owner!==this.getCurrentPlayer()){
                //add into the box of current Player
            }
            else{
                removePiece(piece);
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

module.exports = GameState;