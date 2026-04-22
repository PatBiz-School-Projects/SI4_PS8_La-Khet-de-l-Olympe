import { AppMobileNavbar } from "/shared/components/app-mobile-navbar/app-mobile-navbar.js";

import { apiFetch } from "/utils/wrapFetch.js";


export class GameMobileNavbar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                apiFetch("/game/components/game-mobile-navbar/game-mobile-navbar.html"),
                apiFetch("/game/components/game-mobile-navbar/game-mobile-navbar.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;

            const navButtons = this.shadowRoot.querySelectorAll('[data-section]');
            navButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const section = btn.getAttribute('data-section');

                    this.dispatchEvent(new CustomEvent('game-mobile-nav-click', {
                        detail: { section: section },
                        bubbles: true,
                        composed: true
                    }));
                });
            })

        } catch (err) {
            console.error("Error while loading the component:", err)
        }
    }
}
customElements.define('game-mobile-navbar', GameMobileNavbar);
