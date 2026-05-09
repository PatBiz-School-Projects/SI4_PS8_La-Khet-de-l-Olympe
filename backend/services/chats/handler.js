const { readJsonBody, sendJson, parseCookies } = require("./helpers/parser");
const { extractUserId } = require("./helpers/token");

const { ChatsManager } = require("./ChatsManager");

const { ChatsRepository } = require("./repositories/ChatsRepository");
const { ChatUsersRepository } = require("./repositories/ChatUsersRepository");

const { USER_SERVICE_URL } = process.env;


//
// HTTP
//


exports.HTTPMiddleware_UserAccess = (handlerCb) => async (req, res) => {
    const { userToken } = parseCookies(req.headers.cookie);
    const userId = extractUserId(userToken);

    const { chatId } = req.routeParams;
    try {
        const chat = ChatsManager.getChatById(chatId);
        if (!chat.userIsAllowed(userId)) {
            throw new Error("User is not allowed to access this chat");
        }
    } catch (err) {
        console.error(err);
        sendJson(res, 400, {ok: false, error: err.message});
        return;
    }

    await handlerCb(req, res);
};


exports.HTTPHandler = {
    newChat: async (req, res) => {
        let { chatId } = req.queryParams;
        try {
            if (chatId) {
                await ChatsManager.newChat(chatId);
            } else {
                chatId = await ChatsManager.newChat();
            }
        } catch (err) {
            console.error(err);
            sendJson(res, 400, {ok: false, error: err.message});
            return;
        }

        sendJson(res, 200, {ok: true, chatId});
    },

    deleteChat: async (req, res) => {
        const { chatId } = req.routeParams;

        ChatsManager.deleteChatById(chatId);

        sendJson(res, 200, {ok: true, success: true});
    },

    addUserInChat: async (req, res) => {
        const { chatId } = req.routeParams;

        let { userId } = await readJsonBody(req);
        if (!userId) {
            const err = "Missing 'userId' in request's body";
            console.error(err)
            sendJson(res, 400, {ok: false, error: err});
            return;
        }

        let chat;
        try {
            chat = ChatsManager.getChatById(chatId);
        } catch (err) {
            console.error(err)
            sendJson(res, 404, {ok: false, error: err.message});
            return;
        }

        let user;
        {
            let userMinimalProfile;
            try {
                const response = await fetch(`${USER_SERVICE_URL}/api/users/${userId}/minimal-profile`);
                if (!response.ok) {
                    throw new Error((await response.json()).error);
                }

                userMinimalProfile = await response.json();
            } catch (err) {
                console.error(err);
                sendJson(res, 400, {ok: false, error: err.message});
                return;
            }

            user = { userId, ...userMinimalProfile };
        }

        chat.addUser(user);
        ChatsRepository.addUser(chatId, user);
        if (!await ChatUsersRepository.findById(userId)) {
            ChatUsersRepository.create(user);
        }

        sendJson(res, 200, {ok: true, success: true});

        // Broadcast the new user to the chat's users (if possible/needed)
        if (chat.broadcast) {
            // If the chat doesn't have a broadcast operator it means that no user is connected to it.
            // Thus it's useless to even try to broadcast something.
            chat.broadcast.emit("new-user", { user });
        }
    },

    getChatMessages: async (req, res) => {
        const MESSAGES_RANGE_LENGTH = 20;

        const { chatId } = req.routeParams;

        let { start } = {start: parseInt(req.queryParams.start)};
        if (isNaN(start)) {
            start = 0;
        }
        const end = start + MESSAGES_RANGE_LENGTH;

        let chat;
        try {
            chat = ChatsManager.getChatById(chatId);
        } catch (err) {
            console.error(err)
            sendJson(res, 404, {ok: false, error: err.message});
            return;
        }

        const messages = chat.messages.slice(start, end)
            .map(message => message.toDTO());

        sendJson(res, 200, {ok: true, messages});

        // DEBUG::
        console.log(`Sent ${messages.length} older messages`);
    },

    getUsersInChat: async (req, res) => {
        const { chatId } = req.routeParams;

        let chat;
        try {
            chat = ChatsManager.getChatById(chatId);
        } catch (err) {
            console.error(err)
            sendJson(res, 404, {ok: false, error: err.message});
            return;
        }

        const users = Object.values(chat.users)
            .map(user => user.toDTO());

        sendJson(res, 200, { ok: true, users });

        // DEBUG::
        console.log(`Sent ${users.length} users`);
    },
};


//
// SocketIO
//


exports.SocketIOMiddleware = (socket, next) => {
    const { userToken } = parseCookies(socket.handshake.headers.cookie || "");
    const userId = extractUserId(userToken);

    if (socket.nsp.name === "/global-chat") {
        socket.handshake.query.chatId = ChatsManager.GLOBAL_CHAT_ID;
    }

    const { chatId } = socket.handshake.query;
    try {
        if (!chatId) {
            throw new Error("Missing 'chatId' query parameter");
        }
        const chat = ChatsManager.getChatById(chatId);
        if (!chat.userIsAllowed(userId)) {
            throw new Error("User is not allowed to access this chat");
        }
    } catch (err) {
        console.error("Rejected socket bcs:", err);
        return next(err);
    }

    return next();
};


exports.SocketIOHandler = {
    onConnection: async (io, socket, payload) => {
        const { userToken } = parseCookies(socket.handshake.headers.cookie || "");
        const userId = extractUserId(userToken);

        const { chatId } = socket.handshake.query;
        const chat = ChatsManager.getChatById(chatId);
        chat.users[userId].connect(socket);

        chat.setNamespace(io);

        socket.join(chatId);
    },

    onNewMessage: async (io, socket, {message}) => {
        // DEBUG::
        console.log(`Received new message from "${message.author.username}":\n${message.content}\n`);

        const { chatId } = socket.handshake.query;

        const { userToken } = parseCookies(socket.handshake.headers.cookie || "");
        const userId = extractUserId(userToken);

        console.log(message);
        console.log(userId);

        const chat = ChatsManager.getChatById(chatId);
        chat.addMessage(message);
        ChatsRepository.addMessage(chatId, message);

        // Broadcast the new message to the chat's users
        chat.broadcast.emit("new-message", { message });
    },

    // Add more if needed ...

    onDisconnection: async (io, socket, payload) => {
        const { userToken } = parseCookies(socket.handshake.headers.cookie || "");
        const userId = extractUserId(userToken);

        const { chatId } = socket.handshake.query;
        const chat = ChatsManager.getChatById(chatId);
        chat.users[userId].disconnect();

        socket.leave(chatId);
    },
};


//
// Event Broker
//


exports.EventsHandler = {
    onNewUser: async (event) => {
        const user = {
            userId: event.payload.userId,
            username: event.payload.username,
            profilePicture: event.payload.profilePicture,
        };

        // Must add new user to the global chat

        const globalChat = ChatsManager.getChatById(ChatsManager.GLOBAL_CHAT_ID);
        globalChat.addUser(user);
        ChatsRepository.addUser(ChatsManager.GLOBAL_CHAT_ID, user);
        ChatUsersRepository.create(user);

        // Broadcast the new user to the chat's users (if possible/needed)
        if (globalChat.broadcast) {
            // If the chat doesn't have a broadcast operator it means that no user is connected to it.
            // Thus it's useless to even try to broadcast something.
            globalChat.broadcast.emit("new-user", { user });
        }
    },

    onUserProfileUpdated: async (event) => {
        const { userId, update } = event.payload;

        ChatUsersRepository.update(userId, update);

        for (const [chatId, chat] of Object.entries(ChatsManager.chats)) {
            if (!chat.userIsAllowed(userId)) {
                continue;
            }

            chat.updateUser(userId, update);

            chat.broadcast.emit("update-user", { ...event.payload });
        }
    },
};
