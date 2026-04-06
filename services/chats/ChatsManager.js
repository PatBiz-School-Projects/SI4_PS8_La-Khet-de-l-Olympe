const { Chat, ChatID } = require("./entities/Chat");

const { randomUUID } = require("node:crypto");


class ChatsManager {
    /** @private */
    constructor() { throw new Error(`${this.constructor.name} is not instantiable`); }

    /** @type {Record<ChatID, Chat>} */
    static _chats = {};

    static newChat(chatId = undefined) {
        if (!chatId) {
            chatId = randomUUID();
        }

        if (chatId in this._chats) {
            throw new Error(`Chat w/ id: '${chatId}' already exists`);
        }

        this._chats[chatId] = new Chat(chatId);
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
