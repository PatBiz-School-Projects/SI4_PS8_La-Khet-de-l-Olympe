const { readJsonBody, sendJson, parseCookies } = require("./helpers/parser");

const { ChatsManager } = require("./ChatsManager");

const { USER_SERVICE_URL } = process.env;


//
// HTTP
//


exports.HTTPMiddleware_UserAccess = (handlerCb) => async (req, res) => {
    // TODO : Stop reading user's id in the cookie. Use user's JWT token instead
    const { userId, userToken } = parseCookies(req.headers.cookie);
    const { chatId } = req.routeParams;
    try {
        if (!userToken) {
            throw new Error("Missing 'userToken' cookie");
        }

        // TODO : Check validity of user's token

        if (!userId) {
            throw new Error("Missing 'userId' cookie");
        }
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
                ChatsManager.newChat(chatId);
            } else {
                chatId = ChatsManager.newChat();
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

    addUserInGlobalChat: async (req, res) => {
        const globalChat = ChatsManager.getChatById(ChatsManager.GLOBAL_CHAT_ID);

        let { userId } = await readJsonBody(req);
        if (!userId) {
            const err = "Missing 'userId' in request's body";
            console.error(err)
            sendJson(res, 400, {ok: false, error: err});
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

        globalChat.addUser(user);
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
        sendJson(res, 200, {ok: true, success: true});
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

        const messages = chat.messages.slice(start, end);
        // DEBUG::
        console.log(`Sending ${messages.length} older messages`);
        sendJson(res, 200, {ok: true, messages});
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
    },
};


//
// SocketIO
//


exports.SocketIOMiddleware = (socket, next) => {
    // TODO : Stop reading user's id in the cookie. Use user's JWT token instead
    const { userId, userToken } = parseCookies(socket.handshake.headers.cookie || "");
    const { chatId } = socket.handshake.query;
    try {
        if (!userToken) {
            throw new Error("Missing 'userToken' cookie");
        }

        // TODO : Check validity of user's token

        if (!userId) {
            throw new Error("Missing 'userId' cookie");
        }
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
}


exports.SocketIOHandler = {
    onConnection: async (io, socket, payload) => {
        const { userId, userToken } = parseCookies(socket.handshake.headers.cookie || "");
        const { chatId } = socket.handshake.query;

        const chat = ChatsManager.getChatById(chatId);
        chat.users[userId].connect(socket);

        socket.join(chatId);
    },

    onNewMessage: async (io, socket, {message}) => {
        // DEBUG::
        console.log(`Received new message from "${message.author.username}":\n${message.content}\n`);

        const { chatId } = socket.handshake.query;

        const chat = ChatsManager.getChatById(chatId);
        chat.addMessage(message);

        // Broadcast the new message to the chat's users
        io.to(chatId).emit("new-message", { message });
    },

    // Add more if needed ...

    onDisconnection: async (io, socket, payload) => {
        const { userId, userToken } = parseCookies(socket.handshake.headers.cookie || "");
        const { chatId } = socket.handshake.query;

        const chat = ChatsManager.getChatById(chatId);
        chat.users[userId].disconnect();

        socket.leave(chatId);
    },
};
