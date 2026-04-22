import { AppMobileNavbar } from "/shared/components/app-mobile-navbar/app-mobile-navbar.js";

import { apiFetch } from "/utils/wrapFetch.js";


export class HomeMobileNavbar extends HTMLElement {
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
                apiFetch("/home/components/home-mobile-navbar/home-mobile-navbar.html"),
                apiFetch("/home/components/home-mobile-navbar/home-mobile-navbar.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;
            const navButtons = this.shadowRoot.querySelectorAll(".nav-item[data-section]");

            navButtons.forEach((button) => {
                button.addEventListener("click", () => {
                    const { section } = button.dataset;

                    navButtons.forEach((item) => item.classList.toggle("is-active", item === button));

                    this.dispatchEvent(new CustomEvent("mobile-nav-select", {
                        detail: { section },
                        bubbles: true,
                        composed: true,
                    }));
                });
            });
        } catch (err) {
            console.error("Error while loading the component:", err)
        }
    }
}
customElements.define('home-mobile-navbar', HomeMobileNavbar);
