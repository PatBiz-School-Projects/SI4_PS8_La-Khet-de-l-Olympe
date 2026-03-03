import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

let socket;

onload = async (_) => {
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
        window.location.href = "../game-page/game-page.html";
    } else {
        // Create a socket only if necessary
        socket = io({ path: "/api/game-service/socket.io" });
        socket.on("start-game", async _ => {
            window.location.href = "../game-page/game-page.html";
        });
    }
}

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


// Pick a random message
const label = document.getElementById('waiting-label');
label.textContent = LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)];

const dots = [
    document.getElementById('d1'),
    document.getElementById('d2'),
    document.getElementById('d3'),
];
let current = 0;

function tick() {
    dots.forEach(d => d.classList.remove('lit'));
    dots[current].classList.add('lit');
    current = (current + 1) % 3;
}

tick();
setInterval(tick, 420);
