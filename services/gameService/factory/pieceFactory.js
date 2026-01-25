const Pieces = require("../entities/piece");

class PieceFactory{
    static createPieceFromDto(pieceDto){
        const PieceClass = Pieces[pieceDto.type];
        if(!PieceClass){
            throw new Error(`Type de pièce inconnu : ${pieceDto.type}`);
        }
        return new PieceClass(
            pieceDto.owner,
            pieceDto.x,
            pieceDto.y,
            pieceDto.orientation
        );
    }
}

module.exports = PieceFactory;