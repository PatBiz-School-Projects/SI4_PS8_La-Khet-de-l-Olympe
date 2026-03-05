import { GameBoard, GameTurnIndicator, GamePlayerInventory, GameRotationIndicator } from "/components/index.js";

import { GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";
import { GamePageStateMachine } from "./GamePageStateMachine/GamePageStateMachine.js";
import { GameActionType } from "./GamePageStateMachine/GameAction.js";
import { UIActionType } from "./GamePageStateMachine/UIAction.js";
import { GamePageClickHandler } from "./GamePageClickHandler.js";

import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";


class EventQueue {
    constructor() {
        this.queue = [];
        this.running = false;
    }

    enqueue(fn) {
        return async (...args) => {
            this.queue.push(() => fn(...args));
            if (this.running) return;

            this.running = true;
            while (this.queue.length) {
                await this.queue.shift()();
            }
            this.running = false;
        };
    }
}


const socket = io({ path: "/api/game-service/socket.io" });
const clickHandler = new GamePageClickHandler(document);
const stateMachine = new GamePageStateMachine();


/**
 * @typedef {string} PlayerID
 */


/** @type {PlayerID[]} */
let PLAYERS_ID;

/** @type {PlayerID} */
let CLIENT_PLAYER_ID;

/** @type { Record<PlayerID, GamePlayerInventory> } */
let PLAYERS_INVENTORY = {};

/** @type { Record<PlayerID, GameRotationIndicator> } */
let PLAYERS_ROTATION_INDICATOR = {};


//
// Game page's components
//


/** @type { GameBoard } */
const board = document.querySelector("game-board");
/** @type { GameTurnIndicator } */
const turnIndicator = document.querySelector("game-turn-indicator");
/** @type { GamePlayerInventory } */
const player1Inventory = document.querySelector("game-player-inventory#player1-inventory");
/** @type { GamePlayerInventory } */
const player2Inventory = document.querySelector("game-player-inventory#player2-inventory");
/** @type { GameRotationIndicator } */
const player1RotationIndicator = document.querySelector("#player1-rotation-indicator");
/** @type { GameRotationIndicator } */
const player2RotationIndicator = document.querySelector("#player2-rotation-indicator");


//
// Reloads support
//


async function fetchPlayersId() {
    let playersId;
    try {
        const playersResponse = await fetch("/api/game-service/players");
        if (!playersResponse.ok) {
            throw playersResponse.error;
        }
        ({ playersId } = await playersResponse.json());
    } catch (err) {
        throw err;
    }

    return playersId;
}

async function fetchClientPlayerId() {
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
    PLAYERS_ID = await fetchPlayersId();
    CLIENT_PLAYER_ID = await fetchClientPlayerId();

    const activePlayerId = await askWhoIsPlaying();

    const playerCanPlay = (CLIENT_PLAYER_ID === activePlayerId);
    if (playerCanPlay) {
        // DEBUG::
        console.log(`Faked reception of 'start-turn' event for player with id=${CLIENT_PLAYER_ID}`);

        stateMachine.on({ type: GamePageActionType.START_TURN, payload: {playerId: CLIENT_PLAYER_ID} });
    }

    // TODO (in the backend): Supporting player name
    turnIndicator.activePlayerName = activePlayerId.slice(0, 7);
    turnIndicator.color = PLAYERS_ID.indexOf(activePlayerId) === 1 ? "red" : "blue";

    PLAYERS_INVENTORY[PLAYERS_ID[0]] = player1Inventory;
    player1Inventory.owner = PLAYERS_ID[0];
    player1Inventory.color = "blue";
    player1Inventory.active = true;
    await player1Inventory.actualise();

    PLAYERS_INVENTORY[PLAYERS_ID[1]] = player2Inventory;
    player2Inventory.owner = PLAYERS_ID[1];
    player2Inventory.color = "red";
    player2Inventory.active = false;
    await player2Inventory.actualise();

    PLAYERS_ROTATION_INDICATOR[PLAYERS_ID[0]] = player1RotationIndicator;
    player1RotationIndicator.owner = PLAYERS_ID[0];
    player1RotationIndicator.active = false;

    PLAYERS_ROTATION_INDICATOR[PLAYERS_ID[1]] = player2RotationIndicator;
    player2RotationIndicator.owner = PLAYERS_ID[1];
    player2RotationIndicator.active = false;
}


//
// Generating `GamePageAction`
//


const turnEventQueue = new EventQueue();

socket.on("start-turn", turnEventQueue.enqueue(async payload => {
    // DEBUG::
    console.log(`Received 'start-turn' event for player with id=${payload.playerId}`);

    // It's important to update `CLIENT_PLAYER_ID` each time we get a `start-turn` event
    // for the case where we are in a local multiplayer game.
    CLIENT_PLAYER_ID = payload.playerId;

    stateMachine.on({ type: GamePageActionType.START_TURN, payload: payload });

    // TODO (in the backend): Supporting player name
    turnIndicator.activePlayerName = CLIENT_PLAYER_ID.slice(0, 7);
    turnIndicator.color = PLAYERS_ID.indexOf(CLIENT_PLAYER_ID) === 1 ? "red" : "blue";

    PLAYERS_INVENTORY[CLIENT_PLAYER_ID].active = true;
}));

socket.on("end-turn", turnEventQueue.enqueue(async _ => {
    // DEBUG::
    console.log(`Received 'end-turn' event for player with id=${CLIENT_PLAYER_ID}`);

    // TODO (in the backend) : Add `playerId` in the payload corresponding to the opponent who will starts its turn
    const activePlayerId = await askWhoIsPlaying();

    stateMachine.on({ type: GamePageActionType.END_TURN })

    // TODO (in the backend): Supporting player name
    turnIndicator.activePlayerName = activePlayerId.slice(0, 7);
    turnIndicator.color = PLAYERS_ID.indexOf(activePlayerId) === 1 ? "red" : "blue";

    PLAYERS_INVENTORY[CLIENT_PLAYER_ID].active = false;
}));

onclick = (event) => {
    stateMachine.on(clickHandler.computePageAction(event));
};

player1RotationIndicator.addEventListener("game-rotation", (event) => {
    stateMachine.on(event.detail);
});
player2RotationIndicator.addEventListener("game-rotation", (event) => {
    stateMachine.on(event.detail);
});


//
// Reacting to `UIAction`
//


stateMachine.subscribe([UIActionType.VISUALISE_LEGAL_ACTION], async ({piece, pos}) => {
    try {
        const response = await fetch(`/api/game-service/possible-actions?x=${pos.x}&y=${pos.y}`);
        const legalMoves = await response.json();
        await board.showVisualisationMoves(legalMoves);

        player1RotationIndicator.active = false;
        player2RotationIndicator.active = false;

        const activeRotation = PLAYERS_ROTATION_INDICATOR[CLIENT_PLAYER_ID];
        if (activeRotation) {
            await activeRotation.showPiece(piece, pos);
        }
    } catch (err) {
        throw err;
    }
});

stateMachine.subscribe([UIActionType.STOP_UI_ACTIONS], async () => {
    try {
        await board.renderer.clearVisualisationCanvas();
        player1RotationIndicator.active = false;
        player2RotationIndicator.active = false;
    } catch (err) {
        throw err;
    }
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
                    playerId: CLIENT_PLAYER_ID,
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
                    playerId: CLIENT_PLAYER_ID,
                    piece: piece.toDTO(),
                    pos: pos,
                },
            }),
        });
        if (!placeResponse.ok) {
            throw placeResponse.error;
        }

        ({actionRes, laserRes} = await placeResponse.json());
    } catch (err) {
        throw err;
    }

    // DEBUG::
    console.log("Placement accepted");

    await board.placePiece(piece, pos);
    if (laserRes) {
        await board.showLaserBeam(laserRes.path);
    }
    await PLAYERS_INVENTORY[CLIENT_PLAYER_ID].popPyramid();
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
                    playerId: CLIENT_PLAYER_ID,
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
                    playerId: CLIENT_PLAYER_ID,
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
