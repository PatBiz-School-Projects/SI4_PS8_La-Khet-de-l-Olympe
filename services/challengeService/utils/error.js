function mapError(error) {
    const message = String(error?.message || 'UNKNOWN_ERROR');

    if (message === 'MISSING_TOKEN') return [401, 'MISSING_TOKEN'];
    if (message === 'INVALID_TOKEN' || message.includes('TOKEN')) return [401, 'INVALID_TOKEN'];
    if (message === 'MISSING_TARGET_USER_ID') return [400, 'MISSING_TARGET_USER_ID'];
    if (message === 'CANNOT_SELF_CHALLENGE') return [403, 'CANNOT_SELF_CHALLENGE'];
    if (message === 'USER_NOT_FOUND') return [404, 'USER_NOT_FOUND'];

    return [500, message];
}

module.exports = {mapError};
