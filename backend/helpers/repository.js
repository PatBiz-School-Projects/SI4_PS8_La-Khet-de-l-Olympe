const { MongoClient, Db: MongoDb, Collection: MongoCollection } = require("mongodb");


/**
 * Quick helpers abstracting away the connection to mongodb.
 */
class Repository {
    constructor(collection, {url, db}) {
        /** @private @type {MongoClient} */
        this._client = new MongoClient(url);

        /** @private @type {MongoDb} */
        this._db;

        /** @private @type {MongoCollection} */
        this._collection;

        /** @private @type {boolean} */
        this._isConnected = false;

        this._connection = (async () => {
            await this._client.connect();

            this._db = this._client.db(db);
            this._collection = this._db.collection(collection);

            this._isConnected = true;
        })();
    }

    get connection() {
        return this._connection;
    }

    /** @type {MongoClient} */
    get client() {
        if (!this._isConnected) {
            throw new Error("Cannot access to repository's client bcs: Not Connected")
        }
        return this._client;
    }

    /** @type {MongoDb} */
    get db() {
        if (!this._isConnected) {
            throw new Error("Cannot access to repository's database bcs: Not Connected")
        }
        return this._db;
    }

    /** @type {MongoCollection} */
    get collection() {
        if (!this._isConnected) {
            throw new Error("Cannot access to repository's collection bcs: Not Connected")
        }
        return this._collection;
    }

    isConnected() {
        return this._isConnected;
    }
}

module.exports = { Repository };
