const { ChatsRepository } = require("../repositories/ChatsRepository");

const { ChatUserID, ChatUser, ChatUserDTO } = require("./ChatUser");


/**
 * @typedef {string} ChatID
 */
const ChatID = undefined;


/**
 * @typedef {Object} ChatMessageDTO
 *
 * @prop {ChatUserDTO} author
 * @prop {string} content
 * @prop {number} uploadTimestamp
 */
const ChatMessageDTO = undefined;


class Chat {
    constructor(chatId) {
        /** @private @type {ChatID} */
        this._chatId = chatId;

        /** @private @type {Record<ChatUserID, ChatUser>} */
        this._users = {};

        /** @private @type {ChatMessageDTO[]} */
        this._messages = [];

        ChatsRepository.onceReady(repo => {
            repo.findById(chatId)
                .then(chatEntry => {
                    if (!chatEntry) {
                        repo.create(chatId);
                        return;
                    }

                    for (const user of chatEntry.users) {
                        this._users[user.userId] = ChatUser.fromDTO(user);
                    }

                    this._messages = [...this._messages, ...chatEntry.messages];
                })
                .catch(err => {
                    console.error(`Unexpected error while instantiating chat of id '${chatId}':`, err);
                });
        });
    }

    /** @type {ChatID} */
    get chatId() {
        return this._chatId;
    }

    /**
     * List of all messages in the chat from the latest to the oldest.
     *
     * @type {ChatMessageDTO[]}
     */
    get messages() {
        return [ ...this._messages ];
    }

    /**
     * Mapping by id of all the users in the chat (connected or not).
     *
     * @type {Record<ChatUserID, ChatUser>[]}
     */
    get users() {
        return { ...this._users };
    }

    /**
     * @param {ChatUserID} userId
     *
     * @returns {boolean}
     */
    userIsAllowed(userId) {
        return userId in this._users;
    }

    /**
     * @param {ChatMessageDTO} message
     */
    addMessage(message) {
        console.log(`[ Chat ]: Adding a message in the chat of id '${this._chatId}'`);

        this._messages = [message, ...this._messages];

        ChatsRepository.saveMessage(this._chatId, message);
    }

    /**
     * @param {ChatUserDTO} user
     */
    addUser(user) {
        console.log(`[ Chat ]: Adding a user in the chat of id '${this._chatId}'`);

        this._users[user.userId] = ChatUser.fromDTO(user);

        ChatsRepository.saveUser(this._chatId, user);
    }
}

module.exports = { Chat, ChatID, ChatMessageDTO, ChatUserDTO };
