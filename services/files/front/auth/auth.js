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

    if (!username || !password) {
        setStatus('Veuillez renseigner un nom d utilisateur et un mot de passe.', 'error');
        return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    button.textContent = 'Envoi...';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username, password })
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorLabel = payload.error || 'ERREUR';
            setStatus(`Échec: ${errorLabel}`, 'error');
            return;
        }

        if (payload.token) {
            localStorage.setItem('ps8_token', payload.token);
        }

        setStatus('Succès ! Votre compte a été créé.', 'ok');
    } catch (error) {
        setStatus('Erreur réseau. Réessayez plus tard.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = form.dataset.button;
    }
}

form.addEventListener('submit', handleSubmit);