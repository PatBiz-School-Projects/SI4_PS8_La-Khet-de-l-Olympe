import {authenticatedFetch, ensureValidAccessToken} from "/utils/auth.js"

import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

async function performChallengeRequest(path, options = {}) {
    const token = await ensureValidAccessToken();
    if (!token) {
        return {
            ok: false,
            error: 'MISSING_TOKEN',
            status: 401,
        };
    }

    try {
        const response = await authenticatedFetch(path, options);

        if (!response) {
            return {
                ok: false,
                error: 'MISSING_TOKEN',
                status: 401,
            };
        }

        const payload = await response.json();
        return {
            ok: response.ok,
            status: response.status,
            payload,
        };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            error: 'NETWORK_ERROR',
            status: 0,
        };
    }
}

export async function sendChallenge(targetUserId) {
    return performChallengeRequest('/api/challenge-service/challenges', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId })
    });
}

export async function listIncomingChallenges() {
    return performChallengeRequest('/api/challenge-service/challenges/incoming', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export async function listOutgoingChallenges() {
    return performChallengeRequest('/api/challenge-service/challenges/outgoing', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export async function acceptChallenge(challengeId) {
    return performChallengeRequest(`/api/challenge-service/challenges/${encodeURIComponent(challengeId)}/accept`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export async function declineChallenge(challengeId) {
    return performChallengeRequest(`/api/challenge-service/challenges/${encodeURIComponent(challengeId)}/decline`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export async function cancelChallenge(challengeId) {
    return performChallengeRequest(`/api/challenge-service/challenges/${encodeURIComponent(challengeId)}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function createChallengeSocket() {
    return io({
        path: '/api/challenge-service/socket.io',
    });
}
