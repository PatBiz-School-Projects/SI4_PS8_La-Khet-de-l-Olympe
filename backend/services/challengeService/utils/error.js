function mapError(error) {
    const message = String(error?.message || 'UNKNOWN_ERROR');

    if (message === 'MISSING_TOKEN') return [401, 'MISSING_TOKEN'];
    if (message === 'INVALID_TOKEN' || message.includes('TOKEN')) return [401, 'INVALID_TOKEN'];
    if (message === 'MISSING_TARGET_USER_ID') return [400, 'MISSING_TARGET_USER_ID'];
    if (message === 'MISSING_CHALLENGE_ID') return [400, 'MISSING_CHALLENGE_ID'];
    if (message === 'CANNOT_SELF_CHALLENGE') return [403, 'CANNOT_SELF_CHALLENGE'];
    if (message === 'USER_NOT_FOUND') return [404, 'USER_NOT_FOUND'];
    if (message === 'CHALLENGE_NOT_FOUND') return [404, 'CHALLENGE_NOT_FOUND'];
    if (message === 'INVALID_CHALLENGE_STATUS') return [409, 'INVALID_CHALLENGE_STATUS'];
    if (message === 'FORBIDDEN') return [403, 'FORBIDDEN'];
    if (message === 'TARGET_USER_NOT_CONNECTED') return [409, 'TARGET_USER_NOT_CONNECTED'];
    return [500, message];
}

module.exports = {mapError};
