import { escapeHtml } from "/utils/security.js";
import { apiFetch } from "/utils/wrapFetch.js";


export class ForgotPasswordForm extends HTMLElement {
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
                apiFetch("/auth/components/forgot-password-form/forgot-password-form.html"),
                apiFetch("/auth/components/forgot-password-form/forgot-password-form.css"),
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

        const loadQuestionBtn = this.shadowRoot.getElementById("load-question");

        loadQuestionBtn.onclick = async _ => {
            this._setStatus("");
            const username = form.elements.username.value.trim();

            if (!username) {
                this._setStatus("Veuillez renseigner un nom d'utilisateur.", "error");
                return;
            }

            loadQuestionBtn.hidden = true;

            try {
                const response = await apiFetch("/api/auth/forgot-password/question", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username }),
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    this._setStatus(`Échec: ${payload.error || "ERREUR"}`, "error");
                    return;
                }

                form.elements.question.value = payload.question;

                const questionBlock = this.shadowRoot.querySelector("#question-block");
                const usernameDiv = this.shadowRoot.querySelector("#username-wrapper");
                questionBlock.hidden = false;
                usernameDiv.style.display = 'none';
            } catch (err) {
                console.error(err);
                this._setStatus("Erreur réseau. Réessayez.", "error");
            } finally {
                loadQuestionBtn.disabled = false;
            }
        }
        form.onsubmit = async (event) => {
            event.preventDefault();
            this._setStatus("");

            const username = form.elements.username.value.trim();
            const answer = form.elements.answer.value.trim();
            const newPassword = form.elements.newPassword.value;

            if (!username || !answer || !newPassword) {
                this._setStatus("Tous les champs sont obligatoires.", "error");
                return;
            }

            const submitButton = form.querySelector("button[type=\"submit\"]");
            submitButton.disabled = true;
            submitButton.textContent = "Réinitialisation...";

            try {
                const response = await apiFetch("/api/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, answer, password : newPassword }),
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    this._setStatus(`Échec: ${payload.error || "ERREUR"}`, "error");
                    return;
                }

                this._setStatus("Mot de passe mis à jour. Vous pouvez vous reconnecter.", "ok");
            } catch (err) {
                console.error(err);
                this._setStatus("Erreur réseau. Réessayez.", "error");
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Réinitialiser le mot de passe";
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
customElements.define('forgot-password-form', ForgotPasswordForm);
