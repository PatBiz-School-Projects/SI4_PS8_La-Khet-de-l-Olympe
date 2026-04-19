const { randomUUID } = require("node:crypto");
const { createClient } = require("redis");

const { Event } = require("./event");


/**
 * @typedef {ReturnType<typeof createClient>} RedisClient
 */


/**
 * @typedef {function(Event): void|Promise<void>} Handler
 */


/**
 * Event bus for inter-service communication.
 *
 * Future-proof to eventual migration to persistent event-broker e.g RabbitMQ or Apache Kafka.
 */
class EventBus {
    constructor(service, {url, readonly=false, writeonly=false}={}) {
        /** @private @type {string} */
        this._service = service;

        if (readonly && writeonly) {
            throw new Error("Event bus cannot be readonly & writeonly simultaneously");
        }

        /** @private @type {RedisClient} */
        this._store = createClient({url});
        /** @private @type {RedisClient | null} */
        this._sub = writeonly ? null : this._store.duplicate();
        /** @private @type {RedisClient | null} */
        this._pub = readonly ? null : this._store.duplicate();

        this._connection = this._connect();

        /** @private @type {Record<string, Handler>} */
        this._handlers = {};

        /** @private @type {Set<string>} */
        this._subscriptions = new Set();
    }

    /** @private */
    async _connect() {
        await Promise.all([
            this._store.connect(),
            this._pub?.connect(),
            this._sub?.connect(),
        ]);

        // DEBUG::
        console.log("Event bus connected")
    }

    get raw() {
        return {
            /**
             * @param {string} eventType
             * @param {Handler} handler
             */
            on: (eventType, handler) => {
                this._handlers[eventType] = handler;
            },
        }
    }

    isReadonly() {
        return this._pub === null;
    }

    isWriteonly() {
        return this._sub === null;
    }


    /**
     * @param {Event} event
     */
    async publish(eventType, eventPayload) {
        if (this.isReadonly()) {
            throw new Error("Event bus is readonly");
        }

        await this._connection;

        const enrichedEvent = {
            id: randomUUID(),
            type: eventType,
            payload: eventPayload,
            timestamp: Date.now(),
        };

        await this._pub.publish(`${this._service}.events`, JSON.stringify(enrichedEvent));
    }

    /**
     * @param {string} service
     */
    async subscribe(service) {
        if (this.isWriteonly()) {
            throw new Error("Event bus is writeonly");
        }

        await this._connection;

        if (this._subscriptions.has(service)) {
            return;
        }
        this._subscriptions.add(service);

        await this._sub.subscribe(`${service}.events`, async message => {
            /** @type {Event} */
            const event = JSON.parse(message);

            if (event.type in this._handlers) {
                await this._handlers[event.type](event);
            }
        });
    }


    /**
     * @private
     *
     * @param {Handler} handler
     *
     * @returns {Handler} Safe handler
     */
    _safe(handler) {
        const DEFAULT_RETRIES_AMOUNT = 3;

        /**
         * @param {Event} event
         * @param {number} retries
         */
        const _safeHandler = async (event, retries = DEFAULT_RETRIES_AMOUNT) => {
            const key = `${this._service}.bus:${event.type}:${event.id}`;

            // For idempotency
            const alreadyDone = await this._store.get(key);
            if (alreadyDone) {
                return;
            }

            try {
                await handler(event);
            } catch (err) {
                console.error(`Error handling ${event.type}`, err);

                if (retries > 0) {
                    // DEBUG::
                    console.log(`Retrying... (${retries})`);
                    await _safeHandler(event, retries - 1);
                } else {
                    throw new Error(`Permanent failure: ${JSON.stringify(event)}`);
                }
            }

            // Tag as handled with a TTL of 1h to not overload the memory
            await this._store.set(key, '1', { EX: 3600 });
        }

        return _safeHandler;
    }

    /**
     * @param {string} eventType
     * @param {Handler} handler
     */
    on(eventType, handler) {
        this._handlers[eventType] = this._safe(handler);
    }
}

module.exports = { EventBus };
