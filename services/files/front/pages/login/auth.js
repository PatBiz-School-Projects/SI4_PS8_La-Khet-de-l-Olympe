import { setAuthTokens } from '/utils/auth.js';
const form = document.querySelector('form');
const statusEl = document.querySelector('[data-status]');

function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove('ok', 'error');
    if (type) {
        statusEl.classList.add(type);
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    const endpoint = form.dataset.endpoint;
    const questionInput = form.elements.question;
    const answerInput = form.elements.answer;

    if (!username || !password) {
        setStatus('Veuillez renseigner un nom d utilisateur et un mot de passe.', 'error');
        return;
    }

    if ((questionInput && !questionInput.value.trim()) || (answerInput && !answerInput.value.trim())) {
        setStatus('Veuillez renseigner votre question et votre réponse secrète.', 'error');
        return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    button.textContent = 'Envoi...';

    try {
        const body = {username: username, password: password};
        if (questionInput && answerInput) {
            body.question = questionInput.value.trim();
            body.answer = answerInput.value.trim();
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorLabel = payload.error || 'ERREUR';
            setStatus(`Échec: ${errorLabel}`, 'error');
            return;
        }

        const accessToken = payload.accessToken;
        const refreshToken = payload.refreshToken;
        if (accessToken) {
            setAuthTokens(accessToken, refreshToken);
            setStatus(payload.detail || 'Connexion réussie.', 'ok');
            window.location.href = '/pages/home-page/home-page.html';
            return;
        }

        setStatus(payload.detail , 'ok');
    } catch (error) {
        setStatus('Erreur réseau. Réessayez plus tard.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = form.dataset.button;
    }
}

form.addEventListener('submit', handleSubmit);
