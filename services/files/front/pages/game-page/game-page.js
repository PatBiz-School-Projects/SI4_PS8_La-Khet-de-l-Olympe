import { GameBoard } from "/components/index.js";

import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import { GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";
import { GamePageStateMachine } from "./GamePageStateMachine/GamePageStateMachine.js";
import { GameActionType } from "./GamePageStateMachine/GameAction.js";
import { UIActionType } from "./GamePageStateMachine/UIAction.js";
import { GamePageClickHandler } from "./GamePageClickHandler.js";


const socket = io({ path: "/api/game-service/socket.io" });


/** @type { GameBoard } */
const board = document.querySelector("game-board");
// TODO : Implementing an 'inventory' component and a 'turn indicator' component


let PLAYER_ID;
const stateMachine = new GamePageStateMachine();
const clickHandler = new GamePageClickHandler(document);


//
// Reloads support
//


async function fetchPlayerId() {
    let playerId;
    try {
        const playerResponse = await fetch("/api/game-service/player");
        if (!playerResponse.ok) {
            throw playerResponse.error;
        }
        ({ playerId } = await playerResponse.json());
    } catch (err) {
        throw err;
    }

    return playerId;
}

async function askWhoIsPlaying() {
    let playerId;
    try {
        const activePlayerResponse = await fetch("/api/game-service/active-player");
        if (!activePlayerResponse.ok) {
            throw activePlayerResponse.error;
        }
        ({ playerId } = await activePlayerResponse.json());
    } catch (err) {
        throw err;
    }

    return playerId;
}


onload = async (_) => {
    PLAYER_ID = await fetchPlayerId();

    const playerCanPlay = (PLAYER_ID === (await askWhoIsPlaying()));
    if (playerCanPlay) {
        // DEBUG::
        console.log(`Faked reception of 'start-turn' event for player with id=${PLAYER_ID}`);

        stateMachine.on({ type: GamePageActionType.START_TURN, payload: {playerId: PLAYER_ID} });
    }
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
    // DEBUG::
    console.log(`Received 'start-turn' event for player with id=${payload.playerId}`);

    // It's important to update `PLAYER_ID` each time we get a `start-turn` event
    // for the case where we are in a local multiplayer game
    PLAYER_ID = payload.playerId;

    stateMachine.on({ type: GamePageActionType.START_TURN, payload: payload });
});

// TODO (in the backend) : Dispatching "end-turn" socket event only to the player that cannot play
socket.on("end-turn", _ => {
    // DEBUG::
    console.log(`Received 'end-turn' event for player with id=${PLAYER_ID}`);

    stateMachine.on({ type: GamePageActionType.END_TURN })
});

onclick = (event) => {
    stateMachine.on(clickHandler.computePageAction(event));
};


//
// Reacting to `UIAction`
//


stateMachine.subscribe([UIActionType.VISUALISE_LEGAL_ACTION], async ({piece, pos}) => {
    // TODO : Call endpoint to get legal action for piece on board here (once the endpoint is added)
    // TODO : Start visualisation on game-board here
});

stateMachine.subscribe([UIActionType.STOP_UI_ACTIONS], async () => {
    // TODO : Stop visualisation on game-board here
});


//
// Reacting to `GameAction`
//


stateMachine.subscribe([GameActionType.MOVE_PIECE], async ({piece, from, to}) => {
    // DEBUG::
    console.log("Trying to move piece:", piece, "from:", from, "to:", to);

    let actionRes, laserRes;
    try {
        const moveResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "move",
                args: {
                    playerId: PLAYER_ID,
                    piece: piece.toDTO(),
                    from: from,
                    to: to,
                },
            })
        });
        if (!moveResponse.ok) {
            throw moveResponse.error;
        }

        ({actionRes, laserRes} = await moveResponse.json());
    } catch (err) {
        throw err;
    }

    // DEBUG::
    console.log("Movement accepted");

    await board.movePiece(piece, from, to);
    if (laserRes) {
        await board.showLaserBeam(laserRes.path);
    }
});

stateMachine.subscribe([GameActionType.PLACE_PIECE], async ({piece, pos}) => {
    // DEBUG::
    console.log("Trying to place piece:", piece, "at:", pos);

    let actionRes, laserRes;
    try {
        const placeResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "place",
                args: {
                    playerId: PLAYER_ID,
                    piece: piece.toDTO(),
                    pos: pos,
                },
            }),
        });
        if (!placeResponse.ok) {
            throw placeResponse.error;
        }

        ({actionRes, laserRes} = await moveResponse.json());
    } catch (err) {
        throw err;
    }

    // DEBUG::
    console.log("Placement accepted");

    await board.placePiece(piece, pos);
    if (laserRes) {
        await board.showLaserBeam(laserRes.path);
    }
});

stateMachine.subscribe([GameActionType.ROTATE_PIECE], async ({piece, pos, rotation}) => {
    // TODO : To support
});

stateMachine.subscribe([GameActionType.SWITCH_PIECES], async ({piece1, pos1, piece2, pos2}) => {
    // TODO : To support
});
