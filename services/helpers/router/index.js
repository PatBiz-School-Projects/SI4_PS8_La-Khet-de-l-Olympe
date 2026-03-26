// Small-lib for more generic route bcs we cannot use `fastify` or `express`.

const { IncomingMessage, ServerResponse } = require("node:http");

const { sendJson } = require("../parser");
const { RouteToken, tokenizeRoute } = require("./tokenizer");
const { URLSegment, segmentURL } = require("./segmenter");


/**
 * @typedef {function(IncomingMessage, ServerResponse<IncomingMessage> & { req: IncomingMessage }): Promise<void>} Handler
 */


/**
 * @typedef {typeof HTTPMethod[keyof typeof HTTPMethod]} HTTPMethod
 */
const HTTPMethod = Object.freeze({
    GET: "GET",
    HEAD: "HEAD",
    OPTIONS: "OPTIONS",
    TRACE: "TRACE",
    PUT: "PUT",
    DELETE: "DELETE",
    POST: "POST",
    PATCH: "PATCH",
    CONNECT: "CONNECT",
});


class RouteNode {
    constructor(token, handlers, children) {
        /** @private @type {RouteToken} */
        this._token = token;

        /** @private @type {Record<HTTPMethod, Handler>} */
        this._handlers = handlers;

        /** @private @type {Record<string, RouteNode>} */
        this._children = children;
    }

    /** @type {RouteToken} */
    get token() {
        return this._token;
    }

    /** @type {Record<HTTPMethod, Handler>} */
    get handlers() {
        return { ...this._handlers };
    }
    set handlers(h) {
        this._handlers = h;
    }

    /** @type {Record<string, RouteNode>} */
    get children() {
        return Object.values(this._children);
    }

    /**
     * @param {RouteToken} token
     *
     * @returns {boolean}
     */
    hasChild(token) {
        return token.sig in this._children;
    }

    /**
     * @param {RouteToken} token
     *
     * @returns {RouteNode}
     */
    getChild(token) {
        return this._children[token.sig];
    }

    /**
     * @param {RouteNode} child
     */
    addChild(child) {
        this._children[child.token.sig] = child;
    }

    /**
     * @param {RouteToken} token
     *
     * @returns {RouteNode}
     */
    newChild(token) {
        const newChild = new RouteNode(token, {}, {});
        this.addChild(newChild);
        return newChild;
    }

    /**
     * @param {URLSegment} segment
     *
     * @returns {boolean}
     */
    matchSegment(segment) {
        const queriesMatch = (
            Object.keys(segment.query).every(qp => this._token.queryParams.includes(qp))
            && this._token.queryParams.every(qp => Object.keys(segment.query).includes(qp))
        );
        return (
            queriesMatch && (this._token.isRouteParam() || this._token.name === segment.name)
        );
    }
}

class Router {
    constructor() {
        this.routeRoot = new RouteNode(new RouteToken("", false, []), {}, {});
    }

    /**
     * @param {string} route
     * @param {Record<HTTPMethod, Handler>} handlers
     *
     * @return {Router}
     */
    add(route, handlers) {
        let node = this.routeRoot;
        for (const token of tokenizeRoute(route)) {
            if (node.hasChild(token)) {
                node = node.getChild(token);
            } else {
                node = node.newChild(token);
            }
        }
        node.handlers = handlers;

        return this;
    }

    /**
     * @private
     *
     * @param {IncomingMessage} req
     *
     * @returns {RouteNode}
     */
    _route(req) {
        /** @type {Record<string, string>} */
        req.queryParams = {};
        /** @type {Record<string, string>} */
        req.routeParams = {};

        const url = req.url;
        if (!url) {
            throw new Error("Cannot route request w/o URL");
        }

        let node = this.routeRoot;
        for (const segment of segmentURL(url)) {
            const child = node.children
                .sort((n1, n2) => n1.token.isRouteParam() - n2.token.isRouteParam()) // To match route parameter nodes after those that aren't
                .find(child => child.matchSegment(segment));
            if (!child) {
                throw new Error(`Requests to "${req.url}" are not supported with "${req.method}" method`);
            }

            node = child;

            if (segment.isQueried()) {
                req.queryParams = {...req.queryParams, ...segment.query};
            }
            if (node.token.isRouteParam()) {
                req.routeParams = {...req.routeParams, [node.token.name]: segment.name};
            }
        }

        return node;
    }

    /** @type {Handler} */
    handle = async (req, res) => {
        let node;
        try {
            node = this._route(req);
        } catch (err) {
            console.error(err);
            sendJson(res, 404, {ok: false, error: err.message});
            return;
        }

        if (req.method in node.handlers) {
            await node.handlers[req.method](req, res);
        } else {
            const err = `Requests to "${req.url}" are not supported with "${req.method}" method`
            console.error(err);
            sendJson(res, 404, {ok: false, error: err});
            return;
        }
    }
}

module.exports = { Router };
