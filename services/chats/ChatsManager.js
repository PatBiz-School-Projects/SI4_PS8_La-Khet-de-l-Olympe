const { randomUUID } = require("node:crypto");

const { Server } = require("socket.io");

const { Chat, ChatID, ChatDTO } = require("./entities/Chat");

const { ChatsRepository } = require("./repositories/ChatsRepository");
const { ChatUsersRepository } = require("./repositories/ChatUsersRepository");


class ChatsManager {
    /** @private */
    constructor() { throw new Error(`${this.constructor.name} is not instantiable`); }

    /** @readonly @type {ChatID} */
    static GLOBAL_CHAT_ID = "global-chat";

    /** @private @type {Record<ChatID, Chat>} */
    static _chats = {};

    /** @private @type {Server} */
    static _io = null;

    static {
        // AIIFE to instantiate the global chat
        (async () => {
            await this.newChat(this.GLOBAL_CHAT_ID);
        })()
    }

    /** @type {Record<ChatID, Chat>} */
    static get chats() {
        return { ...this._chats };
    }

    static get io() {
        if (this._io === null) {
            throw new Error("No socket.io server available");
        }
        return this._io;
    }
    static set io(io) {
        this._io = io;
    }

    static async newChat(chatId = undefined) {
        if (chatId in this._chats) {
            throw new Error(`Chat w/ id: '${chatId}' already exists`);
        }

        if (!chatId) {
            chatId = randomUUID();
            // To make sure that the chat id is truly unique
            while (await ChatsRepository.findById(chatId)) {
                chatId = randomUUID();
            }
        }

        let chat;

        const chatEntry = await ChatsRepository.findById(chatId);
        if (!chatEntry) {
            await ChatsRepository.create({
                chatId,
                messages: [],
                users: [],
            });

            chat = await Chat.fromDTO({
                chatId,
                messages: [],
                users: {},
            });
        } else {
            chat = await Chat.fromDTO({
                chatId,
                messages: chatEntry.messages,
                users: await Promise.all(chatEntry.users.map(userId => ChatUsersRepository.findById(userId))),
            });
        }

        chat.broadcast = this.io.to(chatId);
        this._chats[chatId] = chat;
        return chatId;
    }

    /**
     * @param {ChatID} chatId
     *
     * @return {Chat}
     * @throws if there is no chat with the given id
     */
    static getChatById(chatId) {
        const chat = this._chats[chatId];
        if (!chat) {
            throw new Error(`No chat with id: ${chatId} found`);
        }

        return chat;
    }

    /**
     * @param {ChatID} chatId
     */
    static deleteChatById(chatId) {
        delete this._chats[chatId];
    }
}

module.exports = { ChatsManager };
