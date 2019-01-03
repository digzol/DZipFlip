module.exports = class BufferReadError extends require('./BaseError') {
    constructor(message) {
        super('ReadBufferError: An error occurred while parsing the archive.\n  Error: ' + message + '\n');
    }
};