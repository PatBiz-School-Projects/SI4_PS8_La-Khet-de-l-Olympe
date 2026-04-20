const { Collection: MongoCollection } = require("mongodb");

const { Repository } = require("../helpers/repository");

const { ChatID, ChatDTO } = require("../entities/Chat");
const { ChatMessageDTO } = require("../entities/ChatMessage");
const { ChatUserID, ChatUserDTO } = require("../entities/ChatUser");

const { DB_URL, DB_NAME } = process.env;


/**
 * @typedef {Object} ChatEntry
 *
 * @prop {ChatID} _id
 * @prop {ChatID} chatId
 * @prop {ChatMessageDTO[]} messages
 * @prop {ChatUserID[]} users
 */


class ChatsRepository {
    /** @private */
    constructor() { throw new Error(`${this.constructor.name} is not instantiable`); }

    static _REPO = new Repository("chats", {
        db: DB_NAME,
        url: DB_URL,
    });

    /** @private @type {Promise<void>} */
    static get _connection() {
        return this._REPO.connection;
    }

    /** @private  @type { MongoCollection } */
    static get _collection() {
        return this._REPO.collection;
    }


    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////


    /**
     * @param {ChatID} chatId
     */
    static async create({chatId, messages=[], users=[]}) {
        // DEBUG::
        console.log(`[ ChatsRepository ]: Creating new chat of id '${chatId}'`);

        await this._connection;

        return await this._collection.insertOne({
            _id: chatId,
            chatId,
            messages,
            users,
            createdAt: new Date(),
        });
    }

    /**
     * @param {ChatID} chatId
     *
     * @returns {Promise<ChatEntry>}
     */
    static async findById(chatId) {
        await this._connection;

        return await this._collection.findOne({ _id: chatId });
    }

    /**
     * @param {ChatID} chatId
     * @param {ChatMessageDTO} message
     */
    static async addMessage(chatId, message) {
        // DEBUG::
        console.log(`[ ChatsRepository ]: Adding a message to the chat of id '${chatId}'`);

        await this._connection;

        return await this._collection.updateOne({ _id: chatId }, {
            $push: { messages: message },
        });
    }

    /**
     * @param {ChatID} chatId
     * @param {ChatUserDTO} user
     */
    static async addUser(chatId, user) {
        // DEBUG::
        console.log(`[ ChatsRepository ]: Adding a user to the chat of id '${chatId}'`);

        await this._connection;

        return await this._collection.updateOne({ _id: chatId }, {
            $push: { users: user.userId },
        });
    }
}

module.exports = { ChatsRepository };
