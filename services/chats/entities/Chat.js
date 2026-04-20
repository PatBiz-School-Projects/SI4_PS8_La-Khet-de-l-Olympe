const { ChatUser, ChatUserID, ChatUserDTO } = require("./ChatUser");
const { ChatMessage, ChatMessageDTO } = require("./ChatMessage");


/**
 * @typedef {string} ChatID
 */
const ChatID = undefined;


/**
 * @typedef {Object} ChatDTO
 *
 * @prop {ChatID} chatId
 * @prop {ChatMessageDTO[]} messages
 * @prop {Record<ChatUserID, ChatUserDTO>} users
 */
const ChatDTO = undefined;


class Chat {
    constructor(chatId, messages, users) {
        /** @private @type {ChatID} */
        this._chatId = chatId;

        /** @private @type {ChatMessage[]} */
        this._messages = messages;

        /** @private @type {Record<ChatUserID, ChatUser>} */
        this._users = users;
    }

    /** @type {ChatID} */
    get chatId() {
        return this._chatId;
    }

    /**
     * List of all messages in the chat from the latest to the oldest.
     *
     * @type {ChatMessage[]}
     */
    get messages() {
        return [ ...this._messages ];
    }

    /**
     * Mapping by id of all the users in the chat (connected or not).
     *
     * @type {Record<ChatUserID, ChatUser>}
     */
    get users() {
        return { ...this._users };
    }

    /**
     * @param {ChatDTO} chatDTO
     *
     * @returns {Chat}
     */
    static fromDTO(chatDTO) {
        return new Chat(
            chatDTO.chatId,
            chatDTO.messages.map(ChatMessage.fromDTO),
            Object.values(chatDTO.users).reduce((res, user) => {
                res[user.userId] = ChatUser.fromDTO(user);
                return res
            }, {}),
        )
    }

    /**
     * @returns {ChatDTO}
     */
    toDTO() {
        return {
            chatId: this._chatId,
            messages: this._messages.map(message => message.toDTO()),
            users: Object.values(this._users).reduce((res, user) => {
                res[user.userId] = user.toDTO();
                return res
            }, {}),
        }
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
     * @param {ChatMessageDTO} messageDTO
     */
    addMessage(messageDTO) {
        // DEBUG::
        console.log(`[ Chat ]: Adding a message in the chat of id '${this._chatId}'`);

        this._messages = [ChatMessage.fromDTO(messageDTO), ...this._messages];
    }

    /**
     * @param {ChatUserDTO} userDTO
     */
    addUser(userDTO) {
        // DEBUG::
        console.log(`[ Chat ]: Adding a user in the chat of id '${this._chatId}'`);

        this._users[userDTO.userId] = ChatUser.fromDTO(userDTO);
    }
}


module.exports = { Chat, ChatID, ChatDTO };
