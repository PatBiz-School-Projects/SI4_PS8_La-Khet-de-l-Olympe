const Board = require('../entities/board');
const Piece = require('../entities/piece');
class BoardManager {
    constructor() {
        this.board = null;
        this.currentPlayer = 1;
        this.gameStatus = "playing";
    }

    initBoard(req,res) {
        this.board = new Board();
        this.currentPlayer = 1;

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "success", detail: "Board initialisée", grid: this.board.grid, currentPlayer:this.currentPlayer }));

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
        return { ok: true, detail: "PIECE_PLACED", ...this.board.toDTO() }

    }

    movePiece(fromX, fromY, toX, toY) {
        const piece = this.board.grid[fromY][fromX].piece;
        if (!piece) return false;

        this.board.grid[fromY][fromX].reset();
        this.board.grid[toY][toX].addPiece(piece);

        piece.move(toX, toY);
        return true;
    }

}

module.exports = BoardManager;