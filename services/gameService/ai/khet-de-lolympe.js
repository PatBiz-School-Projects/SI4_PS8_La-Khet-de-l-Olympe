

let internalBoard = {}
const Cell = {

}
const Action = {

}

function setInternalBoard(opponentAction) {
    const cellChanged = opponentAction.cell;
    for(let piece of internalBoard) {
        if(cellChanged===piece){
            piece=opponentAction.result //more set to do (rotate...)
        }
    }
}

function checkIfTheresPiece(cell){
    const piece = this.board[move.x][move.y].piece;
    if(move.piece.type!=="Scarab")return !piece;
    else{
        return (piece.type === "Sphinx" || piece.type === "Pharaoh") && piece.owner === move.owner;
    }

}

function getOrthogonalMove(piece){
    if(this.checkIfTheresPiece(piece)===false) return false;
    const previousX = move.piece.x;
    const previousY = move.piece.y;

    const wantedMove = {
        x: move.x,
        y: move.y
    }

    const movesPossible = [];
    movesPossible.push(previousX+1,previousY);
    movesPossible.push(previousX-1,previousY);
    movesPossible.push(previousX,previousY+1);
    movesPossible.push(previousX,previousY-1);

    return movesPossible.contains(wantedMove);

}

function chooseLegalMove(){
    let legalMoves = [];

    for (let piece of internalBoard) {
        //TODO
    }
}

function setup(initialPositions,isFirstPlayer){
    return new Promise((resolve)=>{
        internalBoard=initialPositions;
    })
}

function nextMove(opponentAction){
    return new Promise((resolve)=>{
        setInternalBoard(opponentAction);

    })
}