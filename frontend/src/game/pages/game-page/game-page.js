import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import {
    GameActionTimer,
    GameBoard,
    GameForfeitModal,
    GameOverModal,
    GamePlayerInventory,
    GameRotationIndicator,
    GameTurnIndicator,
    GameMobilePyramidCounter
} from "/game/components/index.js";
import { ChatBox } from "/chat/components/index.js";

import { Piece } from "/game/logic/board/Piece.js";
import { GameActionType } from "/game/logic/GameAction.js";

import { GamePageActionType } from "./GamePageStateMachine/GamePageAction.js";
import { GamePageStateMachine } from "./GamePageStateMachine/GamePageStateMachine.js";
import { UIActionType } from "./GamePageStateMachine/UIAction.js";
import { GamePageClickHandler } from "./GamePageClickHandler.js";
import { GameMode, PlayerID, PlayerDTO } from "./types.js";

import { EventQueue } from "/utils/event.js";
import { apiFetch } from "/utils/wrapFetch.js";

// REVIEW : It's a feature instead of a util
import { sendChallenge } from "/utils/challenge.js"

import { API_HOST } from "/env.js";


//
// Game-page's DOM Components
//


/** @type { GameBoard } */
const board = document.querySelector("game-board");
/** @type { GameTurnIndicator } */
const turnIndicator = document.querySelector("game-turn-indicator");
/** @type { GameActionTimer } */
const actionTimer = document.querySelector("game-action-timer");
/** @type { GamePlayerInventory } */
const player1Inventory = document.querySelector("#player1-inventory");
/** @type { GamePlayerInventory } */
const player2Inventory = document.querySelector("#player2-inventory");
/** @type { GameRotationIndicator } */
const player1RotationIndicator = document.querySelector("#player1-rotation-indicator");
/** @type { GameRotationIndicator } */
const player2RotationIndicator = document.querySelector("#player2-rotation-indicator");
const player1MobileCounter = document.querySelector("#player1-mobile-counter");
const player2MobileCounter = document.querySelector("#player2-mobile-counter");
/** @type { GameForfeitModal } */
const forfeitModal = document.querySelector("game-forfeit-modal");
/** @type { GameOverModal } */
const gameOverModal = document.querySelector("game-over-modal");
/** @type { ChatBox } */
const chatBox = document.querySelector("chat-box");


//
// Utils
//


/**
 * @returns {Promise<GameMode>}
 */
async function apiFetchGameMode() {
    let mode;
    try {
        const response = await apiFetch(`/api/games/${GAME_ID}/mode`);
        if (!response.ok) {
            throw (await response.json()).error;
        }
        ({ mode } = await response.json());
    } catch (err) {
        throw err;
    }

    return mode;
}

/**
 * @returns {Promise<PlayerDTO[]>}
 */
async function apiFetchPlayers() {
    let players;
    try {
        const response = await apiFetch(`/api/games/${GAME_ID}/players`);
        if (!response.ok) {
            throw (await response.json()).error;
        }
        ({ players } = await response.json());
    } catch (err) {
        throw err;
    }

    return players;
}

/**
 * @returns {Promise<PlayerDTO>}
 */
async function apiFetchClientPlayer() {
    let player;
    try {
        const response = await apiFetch(`/api/games/${GAME_ID}/players/client`);
        if (!response.ok) {
            throw (await response.json()).error;
        }
        ({ player } = await response.json());
    } catch (err) {
        throw err;
    }

    return player;
}

/**
 * @returns {Promise<PlayerDTO>}
 */
async function askWhoIsPlaying() {
    let player;
    try {
        const response = await apiFetch(`/api/games/${GAME_ID}/players/active`);
        if (!response.ok) {
            throw (await response.json()).error;
        }
        ({ player } = await response.json());
    } catch (err) {
        throw err;
    }

    return player;
}


//
// Game-page's State Variables
//


const GAME_ID = localStorage.getItem("gameId");

/** @type {GameMode} */
let GAME_MODE;

/** @type {PlayerDTO[]} */
let PLAYERS;

/** @type {PlayerID[]} */
let PLAYERS_ID;

/** @type {Record<PlayerID, PlayerDTO>} */
let PLAYERS_BY_ID;

/** @type {PlayerDTO} */
let CLIENT_PLAYER;

/** @type {Record<PlayerID, "red"|"blue">} */
let PLAYERS_COLOR_BY_ID;

/** @type { Record<PlayerID, GamePlayerInventory> } */
let PLAYERS_INVENTORY_BY_ID;

/** @type { Record<PlayerID, GameRotationIndicator> } */
let PLAYERS_ROTATION_INDICATOR_BY_ID;

async function setupVariables() {
    GAME_MODE = await apiFetchGameMode();

    PLAYERS = await apiFetchPlayers();

    PLAYERS_ID = PLAYERS.map(player => player.playerId);

    PLAYERS_BY_ID = Object.fromEntries(PLAYERS.map(player => [player.playerId, player]));

    CLIENT_PLAYER = await apiFetchClientPlayer();

    PLAYERS_COLOR_BY_ID = { [PLAYERS_ID[0]]: "blue", [PLAYERS_ID[1]]: "red" };

    PLAYERS_INVENTORY_BY_ID = { [PLAYERS_ID[0]]: player1Inventory, [PLAYERS_ID[1]]: player2Inventory };

    PLAYERS_ROTATION_INDICATOR_BY_ID = { [PLAYERS_ID[0]]: player1RotationIndicator, [PLAYERS_ID[1]]: player2RotationIndicator };

    player1MobileCounter.owner = PLAYERS_ID[0];
    player1MobileCounter.color = PLAYERS_COLOR_BY_ID[PLAYERS_ID[0]];

    player2MobileCounter.owner = PLAYERS_ID[1];
    player2MobileCounter.color = PLAYERS_COLOR_BY_ID[PLAYERS_ID[1]];
}

let isGameOver = false;


//
// Game page's logical components
//


const chatSocket = io(API_HOST+"/game-chat", {
    path: "/api/chats/socket.io",
    query: {
        chatId: GAME_ID,
    },
});
const gameSocket = io(API_HOST,{
    path: "/api/games/socket.io",
    query: {
        gameId: GAME_ID,
    },
});
const clickHandler = new GamePageClickHandler(document);
const stateMachine = new GamePageStateMachine();


//
// Reload Support
//


onload = async _ => {
    history.pushState(null, '', location.href);

    await setupVariables();

    const activePlayer = await askWhoIsPlaying();

    const isBot = activePlayer.playerId.startsWith("ai#") || activePlayer.profile?.username === "Bot";
    if (isBot) {
        actionTimer.style.visibility = "hidden";
    } else {
        actionTimer.style.visibility = "visible";
    }

    if (CLIENT_PLAYER.playerId === activePlayer.playerId) {
        // DEBUG::
        console.log(`Faked reception of 'start-turn' event for player with id=${CLIENT_PLAYER.playerId}`);

        stateMachine.on({ type: GamePageActionType.START_TURN, payload: {playerId: CLIENT_PLAYER.playerId} });
    }

    // Initialising turn indicator
    if (GAME_MODE === GameMode.LOCAL_MULTIPLAYER) {
        turnIndicator.activePlayerName = PLAYERS_COLOR_BY_ID[activePlayer.playerId].toUpperCase();
    } else {
        turnIndicator.activePlayerName = activePlayer.profile.username;
    }
    turnIndicator.color = PLAYERS_COLOR_BY_ID[activePlayer.playerId];

    // Initialising players' inventory
    for (const playerId of PLAYERS_ID) {
        const playerInventory = PLAYERS_INVENTORY_BY_ID[playerId];
        const playerRotationIndicator = PLAYERS_ROTATION_INDICATOR_BY_ID[playerId]

        playerInventory.owner = playerId;
        playerInventory.color = PLAYERS_COLOR_BY_ID[playerId];
        playerInventory.active = (playerId === activePlayer.playerId);
        playerRotationIndicator.style.display = (playerId === activePlayer.playerId) ? '' : 'none';
        await playerInventory.actualise();
    }

    player1MobileCounter.count = player1Inventory.getNbOfPyramid();
    player2MobileCounter.count = player2Inventory.getNbOfPyramid();

    player1MobileCounter.active = (PLAYERS_ID[0] === activePlayer.playerId);
    player2MobileCounter.active = (PLAYERS_ID[1] === activePlayer.playerId);

    // Initialising players' rotation indicator
    for (const playerId of PLAYERS_ID) {
        const playerRotationIndicator = PLAYERS_ROTATION_INDICATOR_BY_ID[playerId]

        playerRotationIndicator.owner = playerId;
        playerRotationIndicator.active = false;
    }

    // Initialising chat box
    if (GAME_MODE === GameMode.MULTIPLAYER) {
        chatBox.chatId = GAME_ID;
        await chatBox.actualise();
    } else {
        chatBox.remove();
        gameOverModal.deactivateChallenge();
    }
}


//
// Forfeit Support
//


/** The action to execute once the user forfeited the game */
let pendingForfeitAction = null;

forfeitModal.addEventListener("forfeit-game", () => {
    apiFetch(`/api/games/${GAME_ID}/forfeit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({/* nothing */})
    });

    if (pendingForfeitAction) {
        onbeforeunload = null; // Disable beforeunload BEFORE navigating to prevent it from firing.
        pendingForfeitAction();
    }
});

// There is 3 forfeiting scenarios :
// 1. The user clicked on the home button
// 2. The user closed the page
// 3. The user popped a state from the history (i.e clicked the arrow to go back to the previous page)
//
// The 1st scenario is quite trivial :
const homeBtn = document.querySelector("#home-btn");
homeBtn.onclick = _ => {
    if (isGameOver) {
        return;
    }

    pendingForfeitAction = () => {
        window.location.href = "/home/pages/home-page/home-page.html";
    };
    forfeitModal.show();
}
// However, the 2nd & 3rd scenarios aren't as friendly bcs of how the browsers manage the "beforeunload" event.
// Indeed, during a "beforeunload" event modifactions to the DOM aren't permitted.
// Meaning that the forfeit modal cannot be shown.
//
// Thus for both the 2nd & 3rd scenarios, we have to fallback the forfeit timeout scheduled automatically by the backend
// whenever a socket connection break.
//
// The 2nd scenario triggers only the "beforeunload" event :
onbeforeunload = event => {
    if (isGameOver) {
        return;
    }

    // In case the navigator is older than 2011 🙏
    confirm("Voulez-vous abandonner la partie ?");

    event.preventDefault();
}
// The 3rd scenario triggers the "beforeunload" event then the "popstate" event :
onpopstate = state => {
    // `onbeforeunload` already ran before it

    window.location.href = "/home/pages/home-page/home-page.html";
}


//
// Generating `GamePageAction`
//


const gameEventQueue = new EventQueue();

gameSocket.on("start-turn", gameEventQueue.enqueue(async payload => {
    // DEBUG::
    console.log(`Received 'start-turn' event for player with id=${payload.playerId}`);

    const activePlayer = PLAYERS_BY_ID[payload.playerId];
    actionTimer.style.visibility = "visible";


    stateMachine.on({ type: GamePageActionType.START_TURN, payload: payload });

    if (GAME_MODE === GameMode.LOCAL_MULTIPLAYER) {
        turnIndicator.activePlayerName = PLAYERS_COLOR_BY_ID[activePlayer.playerId].toUpperCase();
    } else {
        turnIndicator.activePlayerName = activePlayer.profile.username;
    }
    turnIndicator.color = PLAYERS_COLOR_BY_ID[activePlayer.playerId];
    turnIndicator.color = PLAYERS_COLOR_BY_ID[activePlayer.playerId];

    if (GAME_MODE === GameMode.LOCAL_MULTIPLAYER) {
        // It's important to update `CLIENT_PLAYER` each time we get a `start-turn` event
        // for the case where we are in a local multiplayer game.
        CLIENT_PLAYER = activePlayer;
    }

    PLAYERS_INVENTORY_BY_ID[CLIENT_PLAYER.playerId].active = true;

    if (CLIENT_PLAYER.playerId === PLAYERS_ID[0]) player1MobileCounter.active = true;
    if (CLIENT_PLAYER.playerId === PLAYERS_ID[1]) player2MobileCounter.active = true;

    await player1Inventory.actualise();
    await player2Inventory.actualise();
}));

gameSocket.on("end-turn", gameEventQueue.enqueue(async _ => {
    // DEBUG::
    console.log(`Received 'end-turn' event for player with id=${CLIENT_PLAYER.playerId}`);

    const activePlayer = PLAYERS[(PLAYERS_ID.indexOf(CLIENT_PLAYER.playerId)+1) % 2];

    const isNextBot = activePlayer.playerId.startsWith("ai#") || activePlayer.profile?.username === "Bot";
    if (isNextBot) {
        actionTimer.style.visibility = "hidden";
    }

    stateMachine.on({ type: GamePageActionType.END_TURN })

    if (GAME_MODE === GameMode.LOCAL_MULTIPLAYER) {
        turnIndicator.activePlayerName = PLAYERS_COLOR_BY_ID[activePlayer.playerId].toUpperCase();
    } else {
        turnIndicator.activePlayerName = activePlayer.profile.username;
    }
    turnIndicator.color = PLAYERS_COLOR_BY_ID[activePlayer.playerId];
    turnIndicator.color = PLAYERS_COLOR_BY_ID[activePlayer.playerId];

    PLAYERS_INVENTORY_BY_ID[CLIENT_PLAYER.playerId].active = false;
    player1MobileCounter.active = false;
    player2MobileCounter.active = false;
}));

gameSocket.on("opponent-action", gameEventQueue.enqueue(async ({method, args, result}) => {

    if (GAME_MODE === GameMode.LOCAL_MULTIPLAYER ) {
        return;
    }

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

            await PLAYERS_INVENTORY_BY_ID[piece.owner].popPyramid();
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

        await player1Inventory.actualise();
        await player2Inventory.actualise();
    }
    gameSocket.emit("animation-complete");
}));

gameSocket.on("game-over", gameEventQueue.enqueue(async ({state, winnerId, rating, ratingUpdate}) => {
    // DEBUG::
    console.log("Received 'game-over' event, with state:" + state + " , winner of id:" + winnerId + "& rating being:", rating);

    const formatRatingUpdate = (ratingPayload) => {
        if (GAME_MODE !== GameMode.MULTIPLAYER || !ratingPayload) {
            return "";
        }

        const delta = ratingPayload.delta;
        const newRating = ratingPayload.newElo;

        if (typeof delta !== "number" || typeof newRating !== "number") {
            return "";
        }

        const signedDelta = delta >= 0 ? `+${delta}` : `${delta}`;
        return `ELO ${signedDelta} · nouveau score ${newRating}.`;
    }

    let baseMessage;
    if (state === "DRAW") {
        baseMessage = "Match nul.";
    } else {
        switch (GAME_MODE) {
            case GameMode.SOLO:
            case GameMode.MULTIPLAYER:
                baseMessage = (CLIENT_PLAYER.playerId === winnerId) ? "Victoire !" : "Défaite...";
                break;
            case GameMode.LOCAL_MULTIPLAYER:
                baseMessage = "Victoire de " + PLAYERS_COLOR_BY_ID[winnerId].toUpperCase();
                break;
        }
    }

    isGameOver = true;
    gameOverModal.show();
    const ratingMessage = formatRatingUpdate(rating ?? ratingUpdate);
    gameOverModal.detail = ratingMessage ? `${baseMessage} ${ratingMessage}` : baseMessage;
}));

gameSocket.on("action-timer-sync", async ({remainingTime}) => {
    actionTimer.onTimerSync(remainingTime);
});


onclick = (event) => {
    if (isGameOver) {
        return;
    }
    const navButton = event.target.closest('[data-section]');

    if (navButton) {
        const section = navButton.dataset.section;

        if (section === 'quit') {
            document.querySelector('game-forfeit-modal').show();
            return;
        }
        if (section === 'info') {
            alert(String.raw`Débrouille toi ¯\_(ツ)_/¯`);
            return;
        }
        if (section === 'chat') {
            console.log("Ouvrir le chat...");
            return;
        }
    }

    stateMachine.on(clickHandler.computePageAction(event));
};


player1Inventory.addEventListener("inventory-click", event => {
    stateMachine.on(event.detail);
});
player2Inventory.addEventListener("inventory-click", event => {
    stateMachine.on(event.detail);
});

player1MobileCounter.addEventListener("inventory-click", event => {
    stateMachine.on(event.detail);
});
player2MobileCounter.addEventListener("inventory-click", event => {
    stateMachine.on(event.detail);
});

player1RotationIndicator.addEventListener("game-rotation", event => {
    stateMachine.on(event.detail);
});
player2RotationIndicator.addEventListener("game-rotation", event => {
    stateMachine.on(event.detail);
});


//
// Reacting to `UIAction`
//


stateMachine.subscribe([UIActionType.VISUALISE_LEGAL_ACTION], async ({piece, pos}) => {
    try {
        player1RotationIndicator.active = false;
        player2RotationIndicator.active = false;

        const activeRotation = PLAYERS_ROTATION_INDICATOR_BY_ID[CLIENT_PLAYER.playerId];
        const isFromInventory = (pos === null || pos === undefined);

        if (isFromInventory) {
            if (activeRotation) {
                await activeRotation.showPiece(piece, null, 'inventory');
            }
        } else {
            const response = await apiFetch(`/api/games/${GAME_ID}/possible-actions?x=${pos.x}&y=${pos.y}`);
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
        const response = await apiFetch(`/api/games/${GAME_ID}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "move",
                args: {
                    playerId: CLIENT_PLAYER.playerId,
                    piece: piece.toDTO(),
                    from: from,
                    to: to,
                },
            })
        });
        if (!response.ok) {
            throw new Error((await response.json()).error);
        }

        actionResult = (await response.json()).result;
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

        await player1Inventory.actualise();
        await player2Inventory.actualise();
        player1MobileCounter.count = player1Inventory.getNbOfPyramid();
        player2MobileCounter.count = player2Inventory.getNbOfPyramid();
    }
    gameSocket.emit("animation-complete");
});

stateMachine.subscribe([GameActionType.PLACE_PIECE], async ({piece, pos}) => {
    // DEBUG::
    console.log("Trying to place piece:", piece, "at:", pos);

    let pieceToPlace = piece;

    const activeRotation = PLAYERS_ROTATION_INDICATOR_BY_ID[CLIENT_PLAYER.playerId];

    if (activeRotation && activeRotation.mode === 'inventory' && activeRotation.currentPiece) {
        pieceToPlace = activeRotation.currentPiece;
    }

    let actionResult;
    try {
        const response = await apiFetch(`/api/games/${GAME_ID}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "place",
                args: {
                    playerId: CLIENT_PLAYER.playerId,
                    piece: pieceToPlace.toDTO(),
                    pos: pos,
                },
            }),
        });
        if (!response.ok) {
            throw new Error((await response.json()).error);
        }

        actionResult = (await response.json()).result;
    } catch (err) {
        console.error("Placement refused:", err);
        return;
    }

    // DEBUG::
    console.log("Placement accepted");

    await PLAYERS_INVENTORY_BY_ID[piece.owner].popPyramid();
    player1RotationIndicator.active = false;
    player2RotationIndicator.active = false;

    await board.placePiece(pieceToPlace, pos);
    if (actionResult?.laserPath) {
        await board.showLaserBeam(actionResult.laserPath);
        // REVIEW : It's better for the backend to send an event when a piece is destroyed
        await board.syncGrid(actionResult.grid);

        await player1Inventory.actualise();
        await player2Inventory.actualise();
        player1MobileCounter.count = player1Inventory.getNbOfPyramid();
        player2MobileCounter.count = player2Inventory.getNbOfPyramid();
    }
});

stateMachine.subscribe([GameActionType.ROTATE_PIECE], async ({piece, pos, rotation}) => {
    // DEBUG::
    console.log("Trying to rotate piece:", piece, "at:", pos, "to the:", rotation);

    let actionResult;
    try {
        const response = await apiFetch(`/api/games/${GAME_ID}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "rotate",
                args: {
                    playerId: CLIENT_PLAYER.playerId,
                    piece: piece.toDTO(),
                    pos: pos,
                    rotation: rotation,
                },
            })
        });
        if (!response.ok) {
            throw new Error((await response.json()).error);
        }

        actionResult = (await response.json()).result;
    } catch (err) {
        console.error("Rotation refused:", err);
        return;
    }

    // DEBUG::
    console.log("Rotation accepted");

    player1RotationIndicator.active = false;
    player2RotationIndicator.active = false;

    await board.rotatePiece(piece, pos, rotation);
    if (actionResult?.laserPath) {
        await board.showLaserBeam(actionResult.laserPath);
        // REVIEW : It's better for the backend to send an event when a piece is destroyed
        await board.syncGrid(actionResult.grid);

        await player1Inventory.actualise();
        await player2Inventory.actualise();
        player1MobileCounter.count = player1Inventory.getNbOfPyramid();
        player2MobileCounter.count = player2Inventory.getNbOfPyramid();
    }

    gameSocket.emit("animation-complete");
});

stateMachine.subscribe([GameActionType.SWITCH_PIECES], async ({piece1, pos1, piece2, pos2}) => {
    // DEBUG::
    console.log("Trying to switch piece:", piece1, "at:", pos1, "with piece:", piece2, "at:", pos2);

    let actionResult;
    try {
        const response = await apiFetch(`/api/games/${GAME_ID}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "switch",
                args: {
                    playerId: CLIENT_PLAYER.playerId,
                    piece1: piece1.toDTO(),
                    pos1: pos1,
                    piece2: piece2.toDTO(),
                    pos2: pos2,
                },
            })
        });
        if (!response.ok) {
            // Simulate click on `piece2` at `pos2` in case the switch action is refused
            stateMachine.on({
                type: GamePageActionType.CANCEL,
            });
            stateMachine.on({
                type: GamePageActionType.CLICKED_PIECE_ON_BOARD,
                payload: {
                    pos: pos2,
                    piece: piece2,
                },
            });

            throw new Error((await response.json()).error);
        }

        actionResult = (await response.json()).result;
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

        await player1Inventory.actualise();
        await player2Inventory.actualise();

        player1MobileCounter.count = player1Inventory.getNbOfPyramid();
        player2MobileCounter.count = player2Inventory.getNbOfPyramid();
    }

    gameSocket.emit("animation-complete");
});


//
// End Game
//


gameOverModal.addEventListener("challenge-opponent", async _ => {
    alert("Ce sera supporté un jour ( ദ്ദി ˙ᗜ˙ )");

    // TODO : To support

    // Old code (Before modal refactor):
    // ---------------------------------
    //
    // function setGameOverStatus(message, isError = false) {
    //     gameOverStatus.textContent = message;
    //     gameOverStatus.style.color = isError ? '#ffb3b3' : '#b8f7c5';
    // }
    //
    // const opponentId = PLAYERS_ID.find(playerId => playerId !== CLIENT_PLAYER.playerId);
    // if (!opponentId) {
    //     setGameOverStatus('Adversaire introuvable.', true);
    //     return;
    // }
    //
    // gameOverChallengeButton.disabled = true;
    // const result = await sendChallenge(opponentId);
    //
    // if (!result.ok) {
    //     const message = result.payload?.error
    //         || (
    //         (result.error === 'MISSING_TOKEN')
    //         ? 'Session expirée. Veuillez vous reconnecter.'
    //         : 'Impossible de défier'
    //     );
    //     setGameOverStatus(message, true);
    //     gameOverChallengeButton.disabled = false;
    //     return;
    // }
    //
    // setGameOverStatus('Défi envoyé avec succès.');
    // gameOverChallengeButton.textContent = 'Défi envoyé';
});


//
// In-Game Chat
//


chatSocket.on("new-message", async ({message}) => {
    // DEBUG::
    console.log(`Received message on in-game chat from "${message.author}":\n${message.content}`);

    await chatBox.onNewMessage(message);
});

chatSocket.on("new-user", async ({user}) => {
    // DEBUG::
    console.log(`New user joined of id '${user.userId}' joined global chat`);

    await chatBox.onNewUser(user);
})

chatSocket.on("update-user", async ({userId, update}) => {
    // DEBUG::
    console.log(`User of id '${userId}' has been updated`);

    await chatBox.onUserUpdate(userId, update);
});

chatBox.addEventListener("send-message", event => {
    const content = event.detail.content;

    // DEBUG::
    console.log(`Sending message to in-game chat:\n${content}`);

    const newMessage = {
        author: CLIENT_PLAYER.userId,
        content,
        uploadTimestamp: Date.now(),
    }

    chatSocket.emit("new-message", { message: newMessage });
});
