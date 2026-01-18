import {Renderer} from "../renderer.js";

class GameBoard extends HTMLElement {
    constructor() {
        super();
        this.boardSize = 600;
        this.renderer = null;
    }

    setUpCanvas(){
        this.canvas = this.querySelector('#gameCanvas');
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.boardSize;
        this.canvas.height = this.boardSize;
    }

    async connectedCallback() {
        try {
            const response = await fetch("board/board.html");
            const html = await response.text();
            this.innerHTML = html;
            this.setUpCanvas();
            this.renderer = new Renderer(this.ctx, this.boardSize);
            const resData = await fetch("/api/init-board");
            const data = await resData.json();
            this.renderer.drawGrid(data);
        }catch (error) {
            console.log(error);
        }

    }

}
customElements.define('game-board', GameBoard);