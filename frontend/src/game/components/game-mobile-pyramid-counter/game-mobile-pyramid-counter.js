import {GamePageActionType} from "/game/pages/game-page/GamePageStateMachine/GamePageAction.js";
import {Piece} from "/game/logic/board/Piece.js";

export class GameMobilePyramidCounter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._count = 0;
        this._color = "blue";
        this._owner = null;
        this._active = false;
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.addEventListener('click', (event) => {
            if (this._active && this._count > 0) {

                event.stopPropagation();

                const pyramidPiece = Piece.fromDTO({
                    type: "Pyramid",
                    owner: this.owner,
                    orientation: "N",
                    color: this.color
                });

                this.dispatchEvent(new CustomEvent("inventory-click", {
                    detail: {
                        type: GamePageActionType.CLICKED_PIECE_IN_INVENTORY,
                        payload: {
                            piece: pyramidPiece,
                            pos: null
                        }
                    },
                    bubbles: true,
                    composed: true
                }));
            }
        });
    }

    set owner(val) { this._owner = val; }
    get owner() { return this._owner; }
    get color() { return this._color; }
    set color(val) {
        this._color = val;
        this.render();
    }

    set active(val) {
        this._active = val;
        this.render();
    }

    set count(val) {
        this._count = val;
        this.render();
    }

    render() {
        const isActiveClass = (this._active && this._count > 0) ? 'is-active' : '';
        const imgSrc = `/assets/pyramid-${this._color}.png`;

        this.shadowRoot.innerHTML = `
            <style>
                .counter-box {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(15, 15, 20, 0.9);
                    border: 1px solid ${this._color === 'blue' ? 'rgba(74,144,226,0.5)' : 'rgba(226,74,74,0.5)'};
                    padding: 6px 10px;
                    border-radius: 12px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                    backdrop-filter: blur(5px);
                    transition: all 0.2s ease;
                    opacity: 0.5;
                    cursor: not-allowed;
                    user-select: none;
                }
                .counter-box.is-active {
                    opacity: 1;
                    cursor: pointer;
                    border-color: ${this._color === 'blue' ? '#4a90e2' : '#e24a4a'};
                    box-shadow: 0 0 12px ${this._color === 'blue' ? 'rgba(74,144,226,0.4)' : 'rgba(226,74,74,0.4)'};
                    transform: translateY(-2px);
                }
                img {
                    width: 28px;
                    height: 28px;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }
                .count {
                    color: #e8dfc0;
                    font-family: 'Cinzel', serif;
                    font-size: 1.1rem;
                    font-weight: 700;
                }
            </style>
            <div class="counter-box ${isActiveClass}">
                <img src="${imgSrc}" alt="Pyramid" onerror="this.style.display='none'">
                <span class="count">x${this._count}</span>
            </div>
        `;
    }
}
customElements.define('game-mobile-pyramid-counter', GameMobilePyramidCounter);
