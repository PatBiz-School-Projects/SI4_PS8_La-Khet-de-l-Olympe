import { GameBoard } from "/components/index.js";

import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import { GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";
import { GamePageStateMachine } from "./GamePageStateMachine/GamePageStateMachine.js";
import { GameActionType } from "./GamePageStateMachine/GameAction.js";
import { GamePageClickHandler } from "./GamePageClickHandler.js";


const socket = io("http://localhost:8000/");

/** @type { GameBoard } */
const board = document.querySelector("game-board");
// TODO : Implementing an 'inventory' component and a 'turn indicator' component

const stateMachine = new GamePageStateMachine();
const clickHandler = new GamePageClickHandler(document);


//
// Generating `GamePageAction`
//


// board.addEventListener('turn-updated', (event) => {
//     const playerNumber = event.detail.player;
//     if(playerIndicator){
//         playerIndicator.textContent = playerNumber;
//         playerIndicator.style.color = (playerNumber === 1) ? "#007bff" : "#dc3545";
//     }
// });

// TODO (in the backend) : Dispatching "start-turn" socket event only to the client (aka player) that can play
socket.on("start-turn", payload => stateMachine.on(
    { type: GamePageActionType.START_TURN, payload: payload }
));

// TODO (in the backend) : Dispatching "end-turn" socket event only to the player that cannot play
socket.on("end-turn", _ => stateMachine.on(
    { type: GamePageActionType.END_TURN }
));

onclick = (event) => stateMachine.on(
    clickHandler.computePageAction(event)
);


//
// Reacting to `GameAction`
//


stateMachine.subscribe([GameActionType.MOVE_PIECE], async ({piece, from, to}) => {
    await board.movePiece(piece, from, to);
});

stateMachine.subscribe([GameActionType.PLACE_PIECE], async ({piece, pos}) => {
    await board.placePiece(piece, pos);
});

stateMachine.subscribe([GameActionType.ROTATE_PIECE], async ({piece, pos, rotation}) => {
    // TODO : To support
});

stateMachine.subscribe([GameActionType.SWITCH_PIECES], async ({piece1, pos1, piece2, pos2}) => {
    // TODO : To support
});
