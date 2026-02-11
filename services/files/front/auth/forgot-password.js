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

    loadQuestionButton.disabled = true;
    loadQuestionButton.textContent = 'Chargement...';

    try {
        const response = await fetch('/api/auth/forgot-password/question', {
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
        setStatus('Question chargée. Entrez votre réponse et un nouveau mot de passe.', 'ok');
    } catch (error) {
        setStatus('Erreur réseau. Réessayez.', 'error');
    } finally {
        loadQuestionButton.disabled = false;
        loadQuestionButton.textContent = 'Afficher ma question';
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
        const response = await fetch('/api/auth/forgot-password', {
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