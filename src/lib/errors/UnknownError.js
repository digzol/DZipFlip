module.exports = class UnknownError extends require('./BaseError') {
    constructor(message) {
        super(message);
    }
};