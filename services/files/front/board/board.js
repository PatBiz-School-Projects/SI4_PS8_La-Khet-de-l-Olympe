import {Renderer} from "../renderer.js";

class GameBoard extends HTMLElement {
    constructor() {
        super();
        this.boardSize = 600;
        this.renderer = null;
        this.data=null;
    }

    setUpCanvas(){
        this.canvas = this.querySelector('#gameCanvas');
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.boardSize;
        this.canvas.height = this.boardSize;
    }
    renderBoard = () => {
        if (!this.renderer || !this.data) return;
        this.renderer.render(this.data, this.renderBoard);
    };
    async connectedCallback() {
        try {
            const response = await fetch("board/board.html");
            this.innerHTML = await response.text();
            this.setUpCanvas();
            this.renderer = new Renderer(this.ctx, this.boardSize);
            const resData = await fetch("/api/init-board");
            const data = await resData.json();
            this.renderer.drawGrid(data.grid);
            const event = new CustomEvent('turn-updated',{
                detail: {player: data.currentPlayer},
                bubbles:true,
                composed: true,
            });
            this.dispatchEvent(event);
            /*await fetch("/api/place", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    x: 4,
                    y: 4,
                    piece: { image: "pyramid.jpg", orientation: "N", owner: 1 }
                })
            });*/
            this.data = await resData.json();
            this.renderBoard();
        }catch (error) {
            console.log(error);
        }

    }

}
customElements.define('game-board', GameBoard);