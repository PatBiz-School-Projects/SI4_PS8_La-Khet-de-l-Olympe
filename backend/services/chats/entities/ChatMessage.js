const { ChatUser, ChatUserID  } = require("./ChatUser");


/**
 * @typedef {Object} ChatMessageDTO
 *
 * @prop {ChatUserID} author
 * @prop {string} content
 * @prop {number} uploadTimestamp
 */
const ChatMessageDTO = undefined;


class ChatMessage {
    constructor(author, content, uploadTimestamp) {
        /** @private @type {ChatUser} */
        this._author = author;

        /** @private @type {string} */
        this._content = content;

        /** @private @type {number} */
        this._uploadTimestamp = uploadTimestamp;
    }

    /** @type {ChatUser} */
    get author() {
        return this.author;
    }

    /** @type {string} */
    get content() {
        return this._content;
    }

    /** @type {number} */
    get uploadTimestamp() {
        return this._uploadTimestamp;
    }

    /**
     * @param {ChatMessageDTO} messageDTO
     *
     * @returns {ChatMessage}
     */
    static fromDTO(messageDTO) {
        return new ChatMessage(
            messageDTO.author,
            messageDTO.content,
            messageDTO.uploadTimestamp,
        );
    }

    /**
     * @returns {ChatUserDTO}
     */
    toDTO() {
        return {
            author: this._author,
            content: this._content,
            uploadTimestamp: this._uploadTimestamp,
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


module.exports = { ChatMessage, ChatMessageDTO };
