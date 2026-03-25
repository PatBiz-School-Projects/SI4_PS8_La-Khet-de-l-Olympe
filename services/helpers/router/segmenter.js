class URLSegment {
    constructor(name, query) {
        /** @private @type {string} */
        this._name = name;
        /** @private @type {Record<string, string>} */
        this._query = query;
    }

    /** @type {string} */
    get name() {
        return this._name;
    }

    /** @type {Record<string, string>} */
    get query() {
        return this._query;
    }

    /** @returns {boolean} */
    isQueried() {
        return Object.keys(this.query).length > 0;
    }
}


/**
 * @param {string} query
 * @returns {Record<string, string>}
 */
function parseQuery(query) {
    if (!query) {
        return {};
    }
    return Object.fromEntries(
        query.split("&").map((param) => param.split("=").map(decodeURIComponent))
    );
}


/**
 * @param {string} url
 *
 * @returns {URLSegment[]}
 */
function segmentURL(url) {
    return url.split("/").map((s) => {
        const parts = s.split("?");
        const name = parts[0];
        const query = parts.length === 2 ? parseQuery(parts[1]) : {};
        return new URLSegment(name, query);
    }).slice(1);
}

module.exports = { URLSegment, segmentURL }
