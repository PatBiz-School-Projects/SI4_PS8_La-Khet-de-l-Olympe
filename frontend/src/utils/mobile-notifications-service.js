import { apiFetch } from "/utils/wrapFetch.js";
import { Capacitor } from "https://cdn.jsdelivr.net/npm/@capacitor/core@8.3.1/+esm";
import { LocalNotifications } from "https://cdn.jsdelivr.net/npm/@capacitor/local-notifications@8.0.2/+esm";
import { PushNotifications } from "https://cdn.jsdelivr.net/npm/@capacitor/push-notifications@8.0.3/+esm";

const FRIEND_REQUEST_LOCAL_CHANNEL_ID = "friend-requests";
const CHALLENGE_LOCAL_CHANNEL_ID = "challenges";
const PUSH_CHANNEL_ID = "friend-requests-push";

const APP_ROUTES = {
    FRIEND_REQUESTS: "friends-requests",
    CHALLENGES: "home-challenges",
};

const deliveredEventKeys = new Map();
const EVENT_DEDUP_TTL_MS = 30000;

let isLocalInitialized = false;
let isPushInitialized = false;
let pushRegistrationDone = false;
let pushRoutingHandler = null;

function isNativePlatform() {
    return Capacitor.getPlatform() !== "web";
}

function buildDedupKey(type, id) {
    return `${type}:${id || "unknown"}`;
}

function hasRecentEvent(key) {
    const now = Date.now();
    for (const [eventKey, timestamp] of deliveredEventKeys.entries()) {
        if (now - timestamp > EVENT_DEDUP_TTL_MS) {
            deliveredEventKeys.delete(eventKey);
        }
    }

    const seenAt = deliveredEventKeys.get(key);
    return Boolean(seenAt && now - seenAt <= EVENT_DEDUP_TTL_MS);
}

function markEventDelivered(key) {
    deliveredEventKeys.set(key, Date.now());
}

export function shouldEmitNativeLocalNotification(type, id) {
    if (!isNativePlatform()) {
        return false;
    }

    if (document.visibilityState === "visible") {
        return false;
    }

    return !hasRecentEvent(buildDedupKey(type, id));
}

export async function initLocalNotifications() {
    if (!isNativePlatform() || isLocalInitialized) {
        return;
    }

    const check = await LocalNotifications.checkPermissions();
    let display = check.display;

    if (display !== "granted") {
        const request = await LocalNotifications.requestPermissions();
        display = request.display;
    }

    if (display !== "granted") {
        return;
    }

    await LocalNotifications.createChannel({
        id: FRIEND_REQUEST_LOCAL_CHANNEL_ID,
        name: "Requêtes d'amis",
        description: "Notifications locales des demandes d'amis",
        importance: 4,
    });

    await LocalNotifications.createChannel({
        id: CHALLENGE_LOCAL_CHANNEL_ID,
        name: "Challenges",
        description: "Notifications locales des challenges reçus",
        importance: 4,
    });

    LocalNotifications.removeAllListeners();
    await LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
        if (!notification) {
            return;
        }
        handlePushNotificationRouting(notification.extra || {});
    });

    isLocalInitialized = true;
}

export async function scheduleFriendRequestLocalNotification(request) {
    if (!request?.id || !shouldEmitNativeLocalNotification("friend-request", request.id)) {
        return;
    }

    await LocalNotifications.schedule({
        notifications: [
            {
                id: Number(String(request.id).replace(/\D/g, "").slice(-8)) || Date.now() % 100000000,
                title: "Demande d'ami",
                body: `${request.requester?.username || "Un joueur"} vous a envoyé une demande d'ami.`,
                channelId: FRIEND_REQUEST_LOCAL_CHANNEL_ID,
                extra: {
                    route: APP_ROUTES.FRIEND_REQUESTS,
                    requestId: request.id,
                    notificationType: "friend-request",
                },
            }
        ],
    });

    markEventDelivered(buildDedupKey("friend-request", request.id));
}

export async function scheduleChallengeLocalNotification(challenge, challengerName = "Un joueur") {
    if (!challenge?.id || !shouldEmitNativeLocalNotification("challenge", challenge.id)) {
        return;
    }

    await LocalNotifications.schedule({
        notifications: [
            {
                id: Number(String(challenge.id).replace(/\D/g, "").slice(-8)) || Date.now() % 100000000,
                title: "Défi reçu",
                body: `${challengerName} vous a défié.`,
                channelId: CHALLENGE_LOCAL_CHANNEL_ID,
                extra: {
                    route: APP_ROUTES.CHALLENGES,
                    challengeId: challenge.id,
                    notificationType: "challenge",
                },
            }
        ],
    });

    markEventDelivered(buildDedupKey("challenge", challenge.id));
}

export async function initPushNotifications({ onTokenRegistered, onFriendRequestPush, onNotificationRoute } = {}) {
    if (!isNativePlatform() || isPushInitialized) {
        pushRoutingHandler = onNotificationRoute || pushRoutingHandler;
        return;
    }

    pushRoutingHandler = onNotificationRoute || pushRoutingHandler;

    await PushNotifications.createChannel({
        id: PUSH_CHANNEL_ID,
        name: "Push Requêtes d'amis",
        description: "Push notifications pour les requêtes d'amis",
        importance: 4,
    });

    PushNotifications.removeAllListeners();

    await PushNotifications.addListener("registration", async ({ value }) => {
        if (!value) {
            return;
        }
        onTokenRegistered?.(value);
        await syncPushTokenWithBackend(value);
    });

    await PushNotifications.addListener("registrationError", ({ error }) => {
        console.error("Push registration error", error);
    });

    await PushNotifications.addListener("pushNotificationReceived", ({ data }) => {
        const type = data?.notificationType || data?.type;
        const requestId = data?.requestId || data?.friendRequestId;

        if (type === "friend-request" && requestId) {
            markEventDelivered(buildDedupKey("friend-request", requestId));
            onFriendRequestPush?.(data);
        }
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
        handlePushNotificationRouting(notification?.data || {});
    });

    isPushInitialized = true;
}

export async function registerPushToken() {
    if (!isNativePlatform() || pushRegistrationDone) {
        return;
    }

    const check = await PushNotifications.checkPermissions();
    let receive = check.receive;

    if (receive !== "granted") {
        const request = await PushNotifications.requestPermissions();
        receive = request.receive;
    }

    if (receive !== "granted") {
        return;
    }

    await PushNotifications.register();
    pushRegistrationDone = true;
}

export async function syncPushTokenWithBackend(token) {
    const response = await apiFetch("/api/users/push-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, provider: "fcm" }),
    });

    if (!response || response.status === 404) {
        console.info("Push token backend endpoint not available yet: expected POST /api/users/push-token");
        return;
    }

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.warn("Failed to sync push token", payload?.error || response.statusText);
    }
}

export function handlePushNotificationRouting(data = {}) {
    const route = data.route || data.notificationRoute;

    if (pushRoutingHandler) {
        pushRoutingHandler(data);
        return;
    }

    if (route === APP_ROUTES.FRIEND_REQUESTS) {
        window.location.href = "/home/pages/home-page/home-page.html#friends-requests";
        return;
    }

    if (route === APP_ROUTES.CHALLENGES) {
        window.location.href = "/home/pages/home-page/home-page.html#home-challenges";
    }
}

export async function clearPushRegistration() {
    pushRegistrationDone = false;
}

export { APP_ROUTES };
