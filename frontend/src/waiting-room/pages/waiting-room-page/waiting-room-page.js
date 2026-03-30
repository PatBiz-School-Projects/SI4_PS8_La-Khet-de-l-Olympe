import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

import { getCookie } from "/utils/cookie.js";

// TODO : Remove `gameId` & use local storage instead to enable simultaneous games
const GAME_ID = getCookie("gameId");


const socket = io({
    path: "/api/game-service/socket.io",
    query: {
        gameId: GAME_ID,
        inWaitingRoom: true,
    },
});


onload = async _ => {
    let hasStarted;
    try {
        const hasStartedResponse = await fetch("/api/game-service/game-has-started");
        if (!hasStartedResponse.ok) {
            throw hasStartedResponse.error;
        }
        ({ hasStarted } = await hasStartedResponse.json());
    } catch (err) {
        throw err;
    }

    if (hasStarted) {
        window.location.href = "/game/pages/game-page/game-page.html";
    }
}

socket.on("start-game", async _ => {
    window.location.href = "/game/pages/game-page/game-page.html";
});


//
// Animation :
//


const LOADING_MSGS = [
    "Invocation de la partie en cours",
    "Les dieux alignent les miroirs",
    "Consultation de l'oracle",
    "Préparation du plateau sacré",
    "Les astres se positionnent",
    "Éveil des lasers divins",
    "Les Pharaons prennent place",
    "Alignement des pyramides",
    "Les sphinx montent la garde",
    "Rituel d'initialisation",
    "Vella code l'arène",
];

// Shuffle messages (Fisher-Yates)
const SHUFFLED_LOADING_MSGS = [...LOADING_MSGS].sort(() => Math.random() - 0.5);

const waitingLabel = document.getElementById('waiting-label');
const dots = [
    document.getElementById('d1'),
    document.getElementById('d2'),
    document.getElementById('d3'),
];

let msgIdx = 0;
function updateWaitingLabel() {
    waitingLabel.textContent = SHUFFLED_LOADING_MSGS[msgIdx];
    msgIdx = (msgIdx + 1) % SHUFFLED_LOADING_MSGS.length;
}

let dotIdx = 0;
function animateDots() {
    dots.forEach(d => d.classList.remove('lit'));
    dots[dotIdx].classList.add('lit');
    dotIdx = (dotIdx + 1) % 3;
}

animateDots();
setInterval(animateDots, 420);

updateWaitingLabel();
setInterval(updateWaitingLabel, 10000);
