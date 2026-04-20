const { randomUUID } = require("node:crypto");

const network = require("./network");

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

        const chatEntry = await ChatsRepository.findById(chatId);
        if (!chatEntry) {
            await ChatsRepository.create({
                chatId,
                messages: [],
                users: [],
            });

            this._chats[chatId] = await Chat.fromDTO({
                chatId,
                messages: [],
                users: {},
            });
        } else {
            this._chats[chatId] = await Chat.fromDTO({
                chatId,
                messages: chatEntry.messages,
                users: await Promise.all(chatEntry.users.map(userId => ChatUsersRepository.findById(userId))),
            });
        }

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
