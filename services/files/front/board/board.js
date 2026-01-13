

class GameBoard extends HTMLElement {
    constructor() {
        super();
        this.gridSize = 10;
        this.boardSize = 600;
        this.cellSize = this.boardSize / this.gridSize;
    }

    drawBoard() {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.ctx.fillStyle="orange"
                this.ctx.fillRect(x*this.cellSize, y*this.cellSize, this.cellSize, this.cellSize);
                this.ctx.strokeStyle="black";
                this.ctx.strokeRect(x*this.cellSize, y*this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }
    async connectedCallback() {
        try {
            const response = await fetch("board/board.html");
            const html = await response.text();
            this.innerHTML = html;
            this.canvas = this.querySelector('#gameCanvas');
            this.ctx = this.canvas.getContext("2d");
            this.canvas.width = this.boardSize;
            this.canvas.height = this.boardSize;
            this.drawBoard();
        }catch (error) {
            console.log(error);
        }

    }

}
customElements.define('game-board', GameBoard);