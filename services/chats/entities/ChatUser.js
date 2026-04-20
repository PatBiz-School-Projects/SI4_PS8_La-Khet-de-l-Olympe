const { Socket } = require('socket.io');


/**
 * @typedef {string} ChatUserID
 */
const ChatUserID = undefined;


/**
 * @typedef {Object} ChatUserDTO
 *
 * @prop {ChatUserID} userId
 * @prop {string} username
 * @prop {string} profilePicture
 */
const ChatUserDTO = undefined;


class ChatUser {
    constructor(userId, username, profilePicture) {
        /** @private @type {ChatUserID} */
        this._userId = userId;

        /** @private @type {string} */
        this._username = username;

        /** @private @type {string} */
        this._profilePicture = profilePicture;

        /** @private @type {Socket | undefined} */
        this._socket;
    }

    /** @type {ChatUserID} */
    get userId() {
        return this._userId;
    }

    /** @type {string} */
    get username() {
        return this._username;
    }

    /** @type {string} */
    get profilePicture() {
        return this._profilePicture;
    }

    /**
     * @type {Socket}
     *
     * @throws if the user is disconnected i.e not having a socket connection
     */
    get socket() {
        if (!this.isConnected()) {
            throw new Error("User is disconnected to the chat");
        }
        return this._socket;
    }

    /**
     * @param {ChatUserDTO} userDTO
     *
     * @returns {ChatUser}
     */
    static fromDTO(userDTO) {
        return new ChatUser(
            userDTO.userId,
            userDTO.username,
            userDTO.profilePicture,
        );
    }

    /**
     * @returns {ChatUserDTO}
     */
    toDTO() {
        return {
            userId: this._userId,
            username: this._username,
            profilePicture: this._profilePicture,
        };
    }

    /**
     * @returns {boolean}
     */
    isConnected() {
        return this._socket !== undefined;
    }

    connect(socket) {
        this._socket = socket;
    }

    disconnect() {
        delete this._socket;
    }
}


module.exports = { ChatUser, ChatUserID, ChatUserDTO };
