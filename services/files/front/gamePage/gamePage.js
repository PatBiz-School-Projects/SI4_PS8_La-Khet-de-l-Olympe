import "../board/board.js";

class GamePage extends HTMLElement {
    constructor() {
        super();
    }

    updateGamePage() {
        const board = this.querySelector("game-board");
        const playerIndicator = this.querySelector("#current-player-id");

        board.addEventListener('turn-updated',(event)=>{
            const playerNumber = event.detail.player;
            if(playerIndicator){
                playerIndicator.textContent = playerNumber;
                playerIndicator.style.color = (playerNumber === 1) ? "#007bff" : "#dc3545";
            }
        })
    }

    async connectedCallback() {
        const response = await fetch("gamePage/gamePage.html");
        this.innerHTML=await response.text();
        this.updateGamePage();
    }
}
customElements.define('game-page', GamePage);