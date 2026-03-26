const { MongoClient } = require("mongodb");

const { GameID } = require("../manager/game");

const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;

class UnavailableResourceError extends Error {}


/**
 * @typedef {unknown} GameSummary
 */


class GameSummariesRepository {
    /** @private @type {GameSummariesRepository} */
    static _INST = new GameSummariesRepository();

    /** @private */
    constructor() {
        this._isReady = false;

        /** @private @type {MongoClient} */
        this._client = new MongoClient(DB_URL);
        this._db;
        this._collection;

        this._client.connect().then(
            _ => {
                this._isReady = true;

                this._db = this._client.db(DB_NAME);
                this._collection = this._db.collection('games');
            }
        );
    }

    // Old : async function getGamesCollection()
    static get collection() {
        if (!GameSummariesRepository._INST._isReady) {
            throw new UnavailableResourceError("Repository is not ready");
        }
        return GameSummariesRepository._INST._collection;
    }

    /**
     * @param {GameID} gameId
     * @param {GameSummary} summary
     *
     * @returns {Promise<unknown>}
     */
    static save(gameId, summary) {
        return GameSummariesRepository.collection.insertOne({
            _id: gameId,
            ...summary,
            createdAt: new Date(),
        });
    }

    /**
     * @param {GameID} gameId
     *
     * @returns {Promise<GameSummary>}
     */
    static async findById(gameId) {
        return GameSummariesRepository.collection.findOne({ _id: gameId });
    }
}

module.exports = { GameSummariesRepository };
