const Board = require('../entities/board');
const Piece = require('../entities/piece');
class BoardManager {
    constructor() {
        this.board = null;
        this.currentPlayer = 1;
        this.gameStatus = "playing";
    }

    initBoard() {
        this.board = new Board();
        this.currentPlayer = 1;
        console.log("Nouvelle partie générée sur le serveur.");
    }

    placePiece(x,y,pieceDTO) {
        // place où faudrait un middleWare pour checker le move
        const piece = {
            owner: pieceDTO.owner,
            x: x,
            y: y,
            orientation: pieceDTO.orientation,
            image: pieceDTO.image,
            move(nx, ny) { this.x = nx; this.y = ny}
        }
        this.board.grid[y][x].addPiece(piece);
        return { ok: true, detail: "PIECE_PLACED", grid:this.board.grid };
    }

    movePiece(fromX, fromY, toX, toY) {
        // précède par des middleware qui diront si le coup est légal (bon tour, bon move...)
        const piece = this.board.grid[fromY][fromX].piece;
        if (!piece) return false;

        this.board.grid[fromY][fromX].reset();
        this.board.grid[toY][toX].addPiece(piece);

        piece.move(toX, toY);
        return {
            ok : true,
            detail: "PIECE_MOVED",
            grid:this.board.grid
        }
    }

}

module.exports = BoardManager;