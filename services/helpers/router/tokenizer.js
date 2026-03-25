class RouteToken {
    constructor(name, isRouteParam, queryParams) {
        /** @private @type {string} */
        this._name = name;
        /** @private @type {string[]} */
        this._queryParams = queryParams;
        /** @private @type {boolean} */
        this._isRouteParam = isRouteParam;
    }

    /** @type {string} */
    get name() {
        return this._name;
    }

    /** @type {string[]} */
    get queryParams() {
        return [ ...this._queryParams ];
    }

    /** @returns {boolean} */
    isRouteParam() {
        return this._isRouteParam;
    }

    /** @type {string} */
    get sig() {
        return `${this.isRouteParam() ? ":" : ""}${this.name}${this.queryParams.length > 0 ? `?[${this.queryParams.join(",")}]` : ""}`;
    }

    toString() {
        return this.sig;
    }
}


/**
 * @param {string} route
 *
 * @returns {RouteToken[]}
 */
function tokenizeRoute(route) {
    return route.split("/").map((t) => {
        let isRouteParam = false;
        if (t.startsWith(":")) {
            t = t.replace(/^:/, "");
            isRouteParam = true;
        }

        let queryParams = [];
        const parts = t.split("?");
        if (parts.length === 2) {
            t = parts[0];
            queryParams = parts[1].split("&").map((p) => p.replace(/=\{\}$/, ""));
        }

        return new RouteToken(t, isRouteParam, queryParams);
    }).slice(1);
}

module.exports = { RouteToken, tokenizeRoute };
