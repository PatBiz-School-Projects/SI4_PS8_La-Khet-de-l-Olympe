import { apiFetch } from '/utils/wrapFetch.js'


const form = document.getElementById('forgot-form');
const statusEl = document.querySelector('[data-status]');
const loadQuestionButton = document.getElementById('load-question');
const questionBlock = document.getElementById('question-block');


function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove('ok', 'error');
    if (type) {
        statusEl.classList.add(type);
    }
}

loadQuestionButton.addEventListener('click', async () => {
    setStatus('');
    const username = form.elements.username.value.trim();

    if (!username) {
        setStatus('Veuillez renseigner un username.', 'error');
        return;
    }

    loadQuestionButton.style.display = 'none';

    try {
        const response = await apiFetch('/api/auth/forgot-password/question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            setStatus(`Échec: ${payload.error || 'ERREUR'}`, 'error');
            return;
        }

        form.elements.question.value = payload.question;
        questionBlock.classList.remove('hidden');
    } catch (error) {
        setStatus('Erreur réseau. Réessayez.', 'error');
    } finally {
        loadQuestionButton.disabled = false;
    }
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    const username = form.elements.username.value.trim();
    const answer = form.elements.answer.value.trim();
    const newPassword = form.elements.newPassword.value;

    if (!username || !answer || !newPassword) {
        setStatus('Tous les champs sont obligatoires.', 'error');
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Réinitialisation...';

    try {
        const response = await apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, answer, password : newPassword })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            setStatus(`Échec: ${payload.error || 'ERREUR'}`, 'error');
            return;
        }

        setStatus('Mot de passe mis à jour. Vous pouvez vous reconnecter.', 'ok');
    } catch (error) {
        setStatus('Erreur réseau. Réessayez.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Réinitialiser le mot de passe';
    }
});
