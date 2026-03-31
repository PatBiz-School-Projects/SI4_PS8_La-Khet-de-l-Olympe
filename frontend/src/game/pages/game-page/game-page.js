import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import { GameBoard, GameTurnIndicator, GamePlayerInventory, GameRotationIndicator } from "/game/components/index.js";

import { Piece } from "/game/logic/board/Piece.js";
import { GameActionType } from "/game/logic/GameAction.js";

import { GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";
import { GamePageStateMachine } from "./GamePageStateMachine/GamePageStateMachine.js";
import { UIActionType } from "./GamePageStateMachine/UIAction.js";
import { GamePageClickHandler } from "./GamePageClickHandler.js";

import { getCookie } from "/utils/cookie.js";
import { EventQueue } from "/utils/event.js";
// REVIEW : It's a feature instead of an utils
import {sendChallenge} from "/utils/challenge.js"


// TODO : Remove `gameId` & use local storage instead to enable simultaneous games
const GAME_ID = getCookie("gameId");


const socket = io({
    path: "/api/game-service/socket.io",
    query: {
        gameId: GAME_ID,
    },
});
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
        const playerResponse = await fetch("/api/game-service/client-player");
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

onload = async _ => {
    PLAYERS_ID = await fetchPlayersId();
    CLIENT_PLAYER_ID = await fetchClientPlayerId();

    const activePlayerId = await askWhoIsPlaying();

    if (CLIENT_PLAYER_ID === activePlayerId) {
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


const gameEventQueue = new EventQueue();

socket.on("start-turn", gameEventQueue.enqueue(async payload => {
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

socket.on("end-turn", gameEventQueue.enqueue(async _ => {
    // DEBUG::
    console.log(`Received 'end-turn' event for player with id=${CLIENT_PLAYER_ID}`);

    // `activePlayerId` correspond to the id of the player who received a `start-turn`
    const activePlayerId = PLAYERS_ID[(PLAYERS_ID.indexOf(CLIENT_PLAYER_ID)+1) % 2];

    stateMachine.on({ type: GamePageActionType.END_TURN })

    // TODO (in the backend): Supporting player name
    turnIndicator.activePlayerName = activePlayerId.slice(0, 7);
    turnIndicator.color = PLAYERS_ID.indexOf(activePlayerId) === 1 ? "red" : "blue";

    PLAYERS_INVENTORY[CLIENT_PLAYER_ID].active = false;
}));

socket.on("opponent-action", gameEventQueue.enqueue(async ({method, args, result}) => {
    // DEBUG::
    console.log(
        "Opponent's action:",
        "\n- action method:", method,
        "\n- action arguments:", args,
        "\n- action result:", result,
    );

    switch (method) {
        case "move": {
            let {piece, from, to} = args;
            piece = board.getPieceAt(from);

            // DEBUG::
            console.log("Opponent moved piece:", piece, "from:", from, "to:", to);

            await board.movePiece(piece, from, to);
        } break;
        case "place": {
            let {piece, pos} = args;
            piece = Piece.fromDTO(piece);

            // DEBUG::
            console.log("Opponent placed piece:", piece, "at:", pos);

            await PLAYERS_INVENTORY[PLAYERS_ID.filter(id => id !== CLIENT_PLAYER_ID)[0]].popPyramid();
            await board.placePiece(piece, pos);
        } break;
        case "rotate": {
            let {piece, pos, rotation} = args;
            piece = board.getPieceAt(pos);

            // DEBUG::
            console.log("Opponent rotated a piece:", piece, "at:", pos, "to the:", rotation);

            await board.rotatePiece(piece, pos, rotation);
        } break;
        case "switch": {
            let {piece1, pos1, piece2, pos2} = args;
            piece1 = board.getPieceAt(pos1);
            piece2 = board.getPieceAt(pos2);

            // DEBUG::
            console.log("Opponent switched piece:", piece1, "at:", pos1, "with piece:", piece2, "at:", pos2);

            await board.switchPieces(piece1, pos1, piece2, pos2);
        } break;
    }

    if (result.laserPath) {
        await board.showLaserBeam(result.laserPath);
        // REVIEW : It's better for the backend to send an event when a piece is destroyed
        await board.syncGrid(result.grid);
    }
}));

socket.on("game-over", gameEventQueue.enqueue(payload => {
    // DEBUG::
    console.log("Received 'game-over' event:", payload);

    showGameOver(payload);
}));


onclick = (event) => {
    if (isGameOver) {
        return;
    }

    stateMachine.on(clickHandler.computePageAction(event));
};

player1Inventory.addEventListener("inventory-click", (event) => {
    stateMachine.on(event.detail);
});
player2Inventory.addEventListener("inventory-click", (event) => {
    stateMachine.on(event.detail);
});

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
        player1RotationIndicator.active = false;
        player2RotationIndicator.active = false;

        const activeRotation = PLAYERS_ROTATION_INDICATOR[CLIENT_PLAYER_ID];
        const isFromInventory = (pos === null || pos === undefined);

        if (isFromInventory) {
            if (activeRotation) {
                await activeRotation.showPiece(piece, null, 'inventory');
            }
        } else {
            const response = await fetch(`/api/game-service/possible-actions?x=${pos.x}&y=${pos.y}`);
            const legalMoves = await response.json();
            await board.showVisualisationMoves(legalMoves);

            if (activeRotation) {
                await activeRotation.showPiece(piece, pos, 'board');
            }
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

    let actionResult;
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

        actionResult = (await moveResponse.json()).result;
    } catch (err) {
        console.error("Movement refused:", err);
        return;
    }

    // DEBUG::
    console.log("Movement accepted");

    await board.movePiece(piece, from, to);
    if (actionResult?.laserPath) {
        await board.showLaserBeam(actionResult.laserPath);
        // REVIEW : It's better for the backend to send an event when a piece is destroyed
        await board.syncGrid(actionResult.grid);
    }
});

stateMachine.subscribe([GameActionType.PLACE_PIECE], async ({piece, pos}) => {
    // DEBUG::
    console.log("Trying to place piece:", piece, "at:", pos);

    let pieceToPlace = piece;

    const activeRotation = PLAYERS_ROTATION_INDICATOR[CLIENT_PLAYER_ID];

    if (activeRotation && activeRotation.mode === 'inventory' && activeRotation.currentPiece) {
        pieceToPlace = activeRotation.currentPiece;
    }

    let actionResult;
    try {
        const placeResponse = await fetch("/api/game-service/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "place",
                args: {
                    playerId: CLIENT_PLAYER_ID,
                    piece: pieceToPlace.toDTO(),
                    pos: pos,
                },
            }),
        });
        if (!placeResponse.ok) {
            throw placeResponse.error;
        }

        actionResult = (await placeResponse.json()).result;
    } catch (err) {
        console.error("Placement refused:", err);
        return;
    }

    // DEBUG::
    console.log("Placement accepted");

    await PLAYERS_INVENTORY[piece.owner].popPyramid();
    player1RotationIndicator.active = false;
    player2RotationIndicator.active = false;

    await board.placePiece(pieceToPlace, pos);
    if (actionResult?.laserPath) {
        await board.showLaserBeam(actionResult.laserPath);
        // REVIEW : It's better for the backend to send an event when a piece is destroyed
        await board.syncGrid(actionResult.grid);
    }
});

stateMachine.subscribe([GameActionType.ROTATE_PIECE], async ({piece, pos, rotation}) => {
    // DEBUG::
    console.log("Trying to rotate piece:", piece, "at:", pos, "to the:", rotation);

    let actionResult;
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

        actionResult = (await rotateResponse.json()).result;
    } catch (err) {
        console.error("Rotation refused:", err);
        return;
    }

    // DEBUG::
    console.log("Rotation accepted");

    await board.rotatePiece(piece, pos, rotation);
    if (actionResult?.laserPath) {
        await board.showLaserBeam(actionResult.laserPath);
        // REVIEW : It's better for the backend to send an event when a piece is destroyed
        await board.syncGrid(actionResult.grid);
    }
});

stateMachine.subscribe([GameActionType.SWITCH_PIECES], async ({piece1, pos1, piece2, pos2}) => {
    // DEBUG::
    console.log("Trying to switch piece:", piece1, "at:", pos1, "with piece:", piece2, "at:", pos2);

    let actionResult;
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

        actionResult = (await switchResponse.json()).result;
    } catch (err) {
        console.error("Switch refused:", err);
        return;
    }

    // DEBUG::
    console.log("Switch accepted");

    await board.switchPieces(piece1, pos1, piece2, pos2);
    if (actionResult?.laserPath) {
        await board.showLaserBeam(actionResult.laserPath);
        // REVIEW : It's better for the backend to send an event when a piece is destroyed
        await board.syncGrid(actionResult.grid);
    }
});

//
// Game Over Logic & Components
//

const gameOverOverlay = document.querySelector("#game-over-overlay");
const gameOverMessage = document.querySelector("#game-over-message");
const gameOverChallengeButton = document.querySelector("#game-over-challenge-btn");
const gameOverStatus = document.querySelector("#game-over-status");
let isGameOver = false;
gameOverChallengeButton.addEventListener('click', challengeOpponent);

function getOpponentId() {
    return PLAYERS_ID.find(playerId => playerId !== CLIENT_PLAYER_ID);
}

function setGameOverStatus(message, isError = false) {
    gameOverStatus.textContent = message;
    gameOverStatus.style.color = isError ? '#ffb3b3' : '#b8f7c5';
}

async function challengeOpponent() {
    const opponentId = getOpponentId();

    if (!opponentId) {
        setGameOverStatus('Adversaire introuvable.', true);
        return;
    }

    gameOverChallengeButton.disabled = true;
    const result = await sendChallenge(opponentId);

    if (!result.ok) {
        const message = result.payload?.error || (result.error === 'MISSING_TOKEN'
            ? 'Session expirée. Veuillez vous reconnecter.'
            : 'Impossible de défier');
        setGameOverStatus(message, true);
        gameOverChallengeButton.disabled = false;
        return;
    }

    setGameOverStatus('Défi envoyé avec succès.');
    gameOverChallengeButton.textContent = 'Défi envoyé';
}

function formatRatingUpdate(ratingUpdate) {
    if (!ratingUpdate) {
        return "";
    }

    const signedDelta = ratingUpdate.delta >= 0 ? `+${ratingUpdate.delta}` : `${ratingUpdate.delta}`;
    return ` ELO ${signedDelta} · nouveau score ${ratingUpdate.newRating}.`;
}

function showGameOver({ state, winnerId, ratingUpdate }) {
    isGameOver = true;
    const isDraw = state === "DRAW";
    const didIWin = winnerId === CLIENT_PLAYER_ID;

    // REVIEW : What happens if the game was a local multiplayer game

    const baseMessage = (
        isDraw
            ? "Match nul."
            : didIWin
                ? "Victoire !"
                : "Défaite..."
    );
    gameOverMessage.textContent = `${baseMessage}${formatRatingUpdate(ratingUpdate)}`;
    gameOverOverlay.classList.remove("hidden");
}
