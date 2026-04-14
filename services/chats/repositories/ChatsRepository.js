const { MongoClient, Db: MongoDb, Collection: MongoCollection } = require("mongodb");

const { ChatID, ChatMessageDTO, ChatUserDTO } = require("../entities/Chat");

const { DB_URL, DB_NAME } = process.env;


/**
 * @typedef {Object} ChatEntry
 *
 * @prop {ChatID} _id
 * @prop {ChatID} chatId
 * @prop {ChatUserDTO[]} users
 * @prop {ChatMessageDTO[]} messages
 */


class ChatsRepository {
    /** @private @type {ChatsRepository} */
    static _INST;

    /** @private @type {boolean} */
    static _isReady = false;

    /** @private @type {Promise<boolean>} */
    static _readiness = (async () => {
        const client = new MongoClient(DB_URL);
        await client.connect();

        const db = client.db(DB_NAME);
        const collection = db.collection(DB_NAME);

        this._INST = new ChatsRepository(client, db, collection);
        this._isReady = true;

        return true;
    })();

    /** @private */
    constructor(client, db, collection) {
        /** @private @type {MongoClient} */
        this._client = client;

        /** @private @type {MongoDb} */
        this._db = db;

        /** @private @type {MongoCollection} */
        this._collection = collection
    }


    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @param {ChatID} chatId
     */
    create(chatId) {
        return this._collection.insertOne({
            _id: chatId,
            messages: [],
            createdAt: new Date(),
        });
    }

    /**
     * @param {ChatID} chatId
     *
     * @returns {Promise<ChatEntry>}
     */
    async findById(chatId) {
        return await this._collection.findOne({ _id: chatId });
    }

    /**
     * @param {ChatID} chatId
     * @param {ChatMessageDTO} message
     */
    saveMessage(chatId, message) {
        console.log(`[ ChatRepository ]: Saving a message for the chat of id '${chatId}'`);

        return this._collection.updateOne({ _id: chatId }, {
            $push: { messages: message },
        });
    }

    /**
     * @param {ChatID} chatId
     * @param {ChatUserDTO} message
     */
    saveUser(chatId, user) {
        console.log(`[ ChatRepository ]: Saving a user for the chat of id '${chatId}'`);

        return this._collection.updateOne({ _id: chatId }, {
            $push: { users: user },
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////


    /**
     * @param {() => void|Promise<void>} cb
     *
     * @returns {Promise<void>}
     */
    static async onceReady(cb) {
        if (await this._readiness) {
            await cb(this._INST);
        } else {
            throw new Error(`${this.constructor.name} was never ready`);
        }
    }

    static assertReadiness() {
        if (!this._isReady) {
            throw new Error(`${this.constructor.name} is not ready`)
        }
    }

    /**
     * @param {ChatID} chatId
     */
    static create(chatId) {
        this.assertReadiness();
        return this._INST.create(chatId);
    }

    /**
     * @param {ChatID} chatId
     *
     * @returns {Promise<ChatEntry>}
     */
    static async findById(chatId) {
        this.assertReadiness();
        return this._INST.findById(chatId);
    }

    /**
     * @param {ChatID} chatId
     * @param {ChatMessageDTO} message
     */
    static saveMessage(chatId, message) {
        this.assertReadiness();
        return this._INST.saveMessage(chatId, message);
    }

    /**
     * @param {ChatID} chatId
     * @param {ChatUserDTO} message
     */
    static saveUser(chatId, user) {
        this.assertReadiness();
        return this._INST.saveUser(chatId, user);
    }
}

module.exports = { ChatsRepository };
