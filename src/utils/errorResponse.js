/**
 * Custom error response helper.
 * Throw this in any controller/service to send a formatted error.
 */
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = ErrorResponse;
