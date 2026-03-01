import { GameBoard, GameTurnIndicator } from "/components/index.js";

import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import { GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";
import { GamePageStateMachine } from "./GamePageStateMachine/GamePageStateMachine.js";
import { GameActionType } from "./GamePageStateMachine/GameAction.js";
import { UIActionType } from "./GamePageStateMachine/UIAction.js";
import { GamePageClickHandler } from "./GamePageClickHandler.js";


const socket = io({ path: "/api/game-service/socket.io" });


/** @type { GameBoard } */
const board = document.querySelector("game-board");
/** @type { GameTurnIndicator } */
const turnIndicator = document.querySelector("game-turn-indicator");
// TODO : Implementing an 'inventory' component


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
    const activePlayerId = await askWhoIsPlaying();

    const playerCanPlay = (PLAYER_ID === activePlayerId);
    if (playerCanPlay) {
        // DEBUG::
        console.log(`Faked reception of 'start-turn' event for player with id=${PLAYER_ID}`);

        stateMachine.on({ type: GamePageActionType.START_TURN, payload: {playerId: PLAYER_ID} });
    }

    // TODO (in the backend): Supporting player name
    turnIndicator.activePlayerName = activePlayerId.slice(0, 7);
    turnIndicator.color = (
        (playerCanPlay)
        ? "blue"
        : "red"
    );
}


//
// Generating `GamePageAction`
//


socket.on("start-turn", async payload => {
    // DEBUG::
    console.log(`Received 'start-turn' event for player with id=${payload.playerId}`);

    // It's important to update `PLAYER_ID` each time we get a `start-turn` event
    // for the case where we are in a local multiplayer game
    PLAYER_ID = payload.playerId;

    stateMachine.on({ type: GamePageActionType.START_TURN, payload: payload });

    // TODO (in the backend): Supporting player name
    turnIndicator.activePlayerName = PLAYER_ID.slice(0, 7);
    turnIndicator.color = "blue";
});

// TODO (in the backend) : Add `playerId` in the payload corresponding to the opponent who will starts its turn
socket.on("end-turn", async _ => {
    // DEBUG::
    console.log(`Received 'end-turn' event for player with id=${PLAYER_ID}`);

    stateMachine.on({ type: GamePageActionType.END_TURN })

    // TODO (in the backend): Supporting player name
    turnIndicator.activePlayerName = (await askWhoIsPlaying()).slice(0, 7);
    turnIndicator.color = "red";
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
    // DEBUG::
    console.log("Trying to rotate piece:", piece, "at:", pos, "to the:", rotation);

    let actionRes, laserRes;
    try {
        const rotateResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "rotate",
                args: {
                    playerId: PLAYER_ID,
                    piece: piece.toDTO(),
                    pos: pos,
                    rotation: rotation,
                },
            })
        });
        if (!rotateResponse.ok) {
            throw rotateResponse.error;
        }

        ({actionRes, laserRes} = await rotateResponse.json());
    } catch (err) {
        throw err;
    }

    // DEBUG::
    console.log("Rotation accepted");

    await board.rotatePiece(piece, pos, rotation);
    if (laserRes) {
        await board.showLaserBeam(laserRes.path);
    }
});

stateMachine.subscribe([GameActionType.SWITCH_PIECES], async ({piece1, pos1, piece2, pos2}) => {
    // DEBUG::
    console.log("Trying to switch piece:", piece1, "at:", pos1, "with piece:", piece2, "at:", pos2);

    let actionRes, laserRes;
    try {
        const switchResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "switch",
                args: {
                    playerId: PLAYER_ID,
                    piece1: piece1.toDTO(),
                    pos1: pos1,
                    piece2: piece2.toDTO(),
                    pos2: pos2,
                },
            })
        });
        if (!switchResponse.ok) {
            // Simulate click on `piece2` at `pos2` in case the switch action is refused
            stateMachine.on({
                type: GamePageActionType.CLICKED_PIECE_ON_BOARD,
                payload: {
                    pos: pos2,
                    piece: piece2,
                },
            })

            throw switchResponse.error;
        }

        ({actionRes, laserRes} = await switchResponse.json());
    } catch (err) {
        throw err;
    }

    // DEBUG::
    console.log("Switch accepted");

    await board.switchPieces(piece1, pos1, piece2, pos2);
    if (laserRes) {
        await board.showLaserBeam(laserRes.path);
    }
});
