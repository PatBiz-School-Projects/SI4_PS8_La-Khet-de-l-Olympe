const { Router } = require("./helpers/router");

const {
    HTTPMiddleware_UserAccess,
    HTTPHandler,
    SocketIOMiddleware,
    SocketIOHandler,
} = require("./handler.js");


const ROUTER = (new Router()
    //
    // Private routes (only for the internal network)
    //

    .add("/internal/api/chats/new-chat", {
        PUT: HTTPHandler.newChat,
    })
    .add("/internal/api/chats/new-chat?chatId={}", { // To create a chat with a given id
        PUT: HTTPHandler.newChat,
    })
    .add("/internal/api/chats/:chatId/", {
        DELETE: HTTPHandler.deleteChat,
    })
    .add("/internal/api/chats/global-chat/add-user", {
        POST: HTTPHandler.addUserInGlobalChat,
    })
    .add("/internal/api/chats/:chatId/add-user/", {
        POST: HTTPHandler.addUserInChat,
    })

    //
    // Public routes
    //

    .add("/api/chats/:chatId/messages", {
        GET: HTTPMiddleware_UserAccess(HTTPHandler.getChatMessages)
    })
    .add("/api/chats/:chatId/messages?start={}", {
        GET: HTTPMiddleware_UserAccess(HTTPHandler.getChatMessages)
    })
    .add("/api/chats/:chatId/users/", {
        GET: HTTPMiddleware_UserAccess(HTTPHandler.getUsersInChat),
    })
);


exports.manage = async (req,res) => {
    await ROUTER.handle(req, res);
}


exports.manageSocket = async (io) => {
    const ROOT_NSP = /^\/$/;
    const GLOBAL_CHAT_NSP = /^\/global-chat$/;
    const FRIEND_CHAT_NSP = /^\/friend-chat$/;
    const GAME_CHAT_NSP  = /^\/game-chat$/;

    const ALLOWED_NAMESPACES = new RegExp(`(?:${ROOT_NSP.source}|${GLOBAL_CHAT_NSP.source}|${FRIEND_CHAT_NSP.source}|${GAME_CHAT_NSP.source})`);

    io = io.of(ALLOWED_NAMESPACES);
    io = io.use(SocketIOMiddleware);

    io.on("connection", async (socket) => {
        console.log("New socket connection");

        await SocketIOHandler.onConnection(socket.nsp, socket, undefined);

        socket.on("new-message", async (msgPayload) => {
            SocketIOHandler.onNewMessage(socket.nsp, socket, msgPayload);
        })

        // socket.on("<event>", async (msgPayload) => {
        //     SocketIOHandler.<event handler>(socket.nsp, socket, msgPayload);
        // })

        // Add more if needed ...

        socket.on("disconnect", async (msgPayload) => {
            SocketIOHandler.onDisconnection(socket.nsp, socket, msgPayload);
        })
    });
}
