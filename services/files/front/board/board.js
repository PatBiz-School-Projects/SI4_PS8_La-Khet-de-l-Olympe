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

        const padding = 40;
        const availableWidth = window.innerWidth - padding;
        const availableHeight = window.innerHeight-30;
        this.boardSize = Math.min(availableWidth, availableHeight);
        this.canvas.width = this.boardSize;
        this.canvas.height = this.boardSize;
    }
    renderBoard = () => {
        if (!this.renderer || !this.data) return;
        console.log("data"+this.data)
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
            const data2= (await fetch("/api/place", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    x: 4,
                    y: 4,
                    piece: {image: "sphinx-removebg-preview.png", orientation: "N", owner: 1}
                })
            }));
            const data3 = await data2.json()
            this.data = data3.grid;
            this.renderBoard();
            const data4 = (await fetch("/api/move", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    fromX: 4,
                    fromY: 4,
                    owner: 1,
                    toX : 6,
                    toY : 6
                }
                )
            }));
            const data5 = await data4.json()
            this.data = data5.grid;
            this.renderBoard()
        }catch (error) {
            console.log(error);
        }

    }

}
customElements.define('game-board', GameBoard);