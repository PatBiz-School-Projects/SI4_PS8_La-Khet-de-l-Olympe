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


let ACTIVE_PLAYER_ID;
const stateMachine = new GamePageStateMachine();
const clickHandler = new GamePageClickHandler(document);

onload = async (_) => {
    let playerId;
    try {
        const currPlayerResponse = await fetch("/api/game-service/curr-player");
        if (!currPlayerResponse.ok) {
            throw moveResponse.error;
        }
        ({ playerId } = await currPlayerResponse.json());
    } catch (err) {
        throw err;
    }

    ACTIVE_PLAYER_ID = playerId;
}


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
socket.on("start-turn", payload => {
    // It's important to update `ACTIVE_PLAYER_ID` each time we get a `start-turn` event
    // for the case where we are in a local multiplayer game
    ACTIVE_PLAYER_ID = payload.playerId;

    stateMachine.on({ type: GamePageActionType.START_TURN, payload: payload });
});

// TODO (in the backend) : Dispatching "end-turn" socket event only to the player that cannot play
socket.on("end-turn", _ => {
    stateMachine.on({ type: GamePageActionType.END_TURN })
});

onclick = (event) => {
    stateMachine.on(clickHandler.computePageAction(event));
};


//
// Reacting to `GameAction`
//


stateMachine.subscribe([GameActionType.MOVE_PIECE], async ({piece, from, to}) => {
    // DEBUG::
    console.log("Trying to move piece:", piece, "from:", from, "to:", to);

    try {
        const moveResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "move",
                args: {
                    playerId: ACTIVE_PLAYER_ID,
                    piece: piece.toDTO(),
                    from: from,
                    to: to,
                },
            })
        });
        if (!moveResponse.ok) {
            throw moveResponse.error;
        }
    } catch (err) {
        throw err;
    }

    // DEBUG::
    console.log("Movement accepted");

    await board.movePiece(piece, from, to);
});

stateMachine.subscribe([GameActionType.PLACE_PIECE], async ({piece, pos}) => {
    // DEBUG::
    console.log("Trying to place piece:", piece, "at:", pos);

    try {
        const placeResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "place",
                args: {
                    playerId: ACTIVE_PLAYER_ID,
                    piece: piece.toDTO(),
                    pos: pos,
                },
            }),
        });
        if (!placeResponse.ok) {
            throw placeResponse.error;
        }
    } catch (err) {
        throw err;
    }

    // DEBUG::
    console.log("Placement accepted");

    await board.placePiece(piece, pos);
});

stateMachine.subscribe([GameActionType.ROTATE_PIECE], async ({piece, pos, rotation}) => {
    // TODO : To support
});

stateMachine.subscribe([GameActionType.SWITCH_PIECES], async ({piece1, pos1, piece2, pos2}) => {
    // TODO : To support
});
