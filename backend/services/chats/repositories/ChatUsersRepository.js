const { Collection: MongoCollection } = require("mongodb");

const { Repository } = require("../helpers/repository");

const { ChatUserID, ChatUserDTO } = require("../entities/ChatUser");

const { DB_URL, DB_NAME } = process.env;


/**
 * @typedef {{_id: ChatUserID} & ChatUserDTO} ChatUserEntry
 */


class ChatUsersRepository {
    /** @private */
    constructor() { throw new Error(`${this.constructor.name} is not instantiable`); }

    static _REPO = new Repository("users", {
        db: DB_NAME,
        url: DB_URL,
    });

    /** @private @type {Promise<void>} */
    static get _connection() {
        return this._REPO.connection;
    }

    /** @private @type { MongoCollection } */
    static get _collection() {
        return this._REPO.collection;
    }


    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////


    /**
     * @param {ChatUserDTO} user
     *
     * @returns {Promise<unknown>}
     */
    static async create({userId, username, profilePicture}) {
        // DEBUG::
        console.log(`[ ChatUsersRepository ]: Creating new user of id '${userId}'`);

        await this._connection;

        return await this._collection.insertOne({
            _id: userId,
            userId,
            username,
            profilePicture,
            createdAt: new Date(),
        });
    }

    /**
     * @param {ChatUserID} userId
     *
     * @returns {Promise<ChatUserEntry>}
     */
    static async findById(userId) {
        await this._connection;

        return await this._collection.findOne({ _id: userId });
    }

    /**
     * @param {ChatUserID} userId
     * @param {
     *     username?: string,
     *     prodilePicture?: string,
     * } update
     *
     * @returns {Promise<unknown>}
     */
    static async update(userId, update) {
        await this._connection;

        // DEBUG::
        console.log(`[ ChatRepository ]: Updating user of id '${userId}'`);

        return await this._collection.updateOne({_id: userId,}, {
            $set: { ...update },
        });
    }
}

module.exports = { ChatUsersRepository };
