import { escapeHtml } from "/utils/security.js";
import { apiFetch } from "/utils/wrapFetch.js";
import { setAuthTokens } from '/utils/auth.js';


export class LoginForm extends HTMLElement {
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
                apiFetch("/auth/components/login-form/login-form.html"),
                apiFetch("/auth/components/login-form/login-form.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;
        } catch (err) {
            console.error("Error while loading the component:", err)
            return;
        }

        const form = this.shadowRoot.querySelector("form");

        form.onsubmit = async (event) => {
            event.preventDefault();
            this._setStatus("");

            const username = form.elements.username.value.trim();
            const password = form.elements.password.value;

            if (!username || !password) {
                this._setStatus("Veuillez renseigner un nom d utilisateur et un mot de passe.", "error");
                return;
            }

            const button = form.querySelector('button');
            button.disabled = true;
            button.textContent = 'Envoi...';

            try {
                const response = await apiFetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({username, password}),
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    const errorLabel = payload.error || "ERREUR";
                    this._setStatus(`Échec: ${errorLabel}`, "error");
                    return;
                }

                const accessToken = payload.accessToken;
                const refreshToken = payload.refreshToken;
                if (accessToken) {
                    setAuthTokens(accessToken, refreshToken);
                    this._setStatus(payload.detail || "Connexion réussie.", "ok");
                    window.location.href = "/home/pages/home-page/home-page.html";
                    return;
                }
            } catch (err) {
                console.error(err);
                this._setStatus("Erreur réseau. Réessayez plus tard.", "error");
            } finally {
                button.disabled = false;
                button.textContent = form.dataset.button;
            }
        }
    }

    /**
     * Called when the web component is removed from the DOM.
     */
    async disconnectedCallback() {/* nothing */}


    _setStatus(message, type) {
        const statusElem = this.shadowRoot.querySelector("[data-status]");
        statusElem.textContent = message;
        statusElem.classList.remove("ok", "error");
        if (type) {
            statusElem.classList.add(type);
        }
    }
}
customElements.define('login-form', LoginForm);
