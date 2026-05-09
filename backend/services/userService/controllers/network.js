const { Server: HTTPServer } = require("http");
// const { Server: IOServer } = require("socket.io");
const { EventBus } = require("../helpers/event-bus");


class NetworksInterface {
    /** @private @type {HTTPServer | null} */
    static _server = null;

    /** @private @type {IOServer | null} */
    static _io = null;

    /** @private @type {EventBus | null} */
    static _bus = null;


    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////


    /** @private @type {HTTPServer} */
    static get server() {
        if (this._server === null) {
            throw new Error("No network interface 'server' defined");
        }
        return this._server;
    }
    static set server(server) {
        this._server = server;
    }

    /** @private @type {IOServer} */
    static get io() {
        if (this._io === null) {
            throw new Error("No network interface 'io' defined");
        }
        return this._io;
    }
    static set io(io) {
        this._io = io;
    }

    /** @private @type {EventBus} */
    static get bus() {
        if (this._bus === null) {
            throw new Error("No network interface 'bus' defined");
        }
        return this._bus;
    }
    static set bus(bus) {
        this._bus = bus;
    }
}

module.exports = NetworksInterface;
