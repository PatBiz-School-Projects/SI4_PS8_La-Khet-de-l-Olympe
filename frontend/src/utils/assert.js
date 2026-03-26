export class AssertionError extends Error {
    /**
     * @param {string} msg
     */
    constructor(msg) {super(msg)}
}

/**
 * @param {unkown} condition 
 * @param {string|undefined} message 
 * @returns {asserts condition}
 */
export function assert(condition, message) {
    if (condition) {
        return;
    }

    if (message) {
        throw new AssertionError(`AssertionError: ${message}`);
    }

    throw new AssertionError("AssertionError");
}