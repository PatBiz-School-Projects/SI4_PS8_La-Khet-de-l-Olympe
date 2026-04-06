const { Socket } = require('socket.io');

/**
 * @typedef {string} UserID
 */

/**
 * @typedef {Object} User
 *
 * @prop {UserID} userId
 * @prop {string} username
 * @prop {string} profilePicture
 * @prop {Socket|undefined} socket
 */


/**
 * @typedef {string} ChatID
 */
const ChatID = undefined;


/**
 * @typedef {Object} ChatMessage
 *
 * @prop {User} author
 * @prop {string} content
 * @prop {number} uploadTimestamp
 */
const ChatMessage = undefined;


class Chat {
    constructor(chatId) {
        /** @private @type {ChatID} */
        this._chatId = chatId;

        /** @private @type {Record<UserID, User>} */
        this._users = {};

        /** @private @type {ChatMessage[]} */
        this._messages = []
    }

    /** @type {ChatID} */
    get chatId() {
        return this._chatId;
    }

    /** @type {User[]} */
    get users() {
        return this._users;
    }

    /** @type {User[]} */
    get connectedUsers() {
        return this._users.filter(user => user.socket !== undefined);
    }

    userIsAllowed(userId) {
        return userId in this._users;
    }

    /**
     * @param {number} start
     * @param {number} end
     *
     * @returns {ChatMessage[]}
     */
    getMessages(start, end) {
        return [ ...this._messages.slice(start, end) ].reverse();
    }

    getUsers() {
        return Object.values(this._users);
    }

    /**
     * @param {ChatMessage} message
     */
    addMessage(message) {
        this._messages = [message, ...this._messages];
    }

    addUser(user) {
        this._users[user.userId] = user;
    }

    connectUser(userId, socket) {
        this._users[userId].socket = socket;
    }

    disconnectUser(userId) {
        delete this._users[userId].socket;
    }
}

module.exports = { Chat, ChatID };
