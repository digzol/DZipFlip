module.exports = class BufferWriteError extends require('./BaseError') {
    constructor(message) {
        super('BufferWriteError: An error occurred while writing the archive.\n  Error: ' + message + '\n');
    }
};