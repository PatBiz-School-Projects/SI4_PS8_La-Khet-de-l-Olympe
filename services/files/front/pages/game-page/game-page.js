import "/components/index.js";


const board = document.querySelector("game-board");
const playerIndicator = document.querySelector("#current-player-id");

board.addEventListener('turn-updated', (event)=>{
    const playerNumber = event.detail.player;
    if(playerIndicator){
        playerIndicator.textContent = playerNumber;
        playerIndicator.style.color = (playerNumber === 1) ? "#007bff" : "#dc3545";
    }
});
