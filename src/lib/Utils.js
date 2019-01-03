const Constants = require('./Constants');

/**
 * Merge option settings to a static default setting
 * @param defaults - The static default settings
 * @param object - The input option settings
 * @returns {Object} - The merged object
 */
function MergeDefaults(defaults, object) {
    return Object.assign({}, defaults, object);
}

/**
 *
 * @param buffer
 * @param start
 * @param size
 * @returns {Array}
 */
function ReadRecord(buffer, start, ...size) {
    size[0] = size[0] || (buffer.length - start);

    const result = [];
    let offset = start;

    size.forEach((bytesToRead, i) => {
        switch (bytesToRead) {
            case 1:
                result[i] = buffer.readUInt8(offset);
                break;
            case 2:
                result[i] = buffer.readUInt16LE(offset);
                break;
            case 4:
                result[i] = buffer.readUInt32LE(offset);
                break;
            default: throw new Error('Unsupported size to read: ' + bytesToRead);
        }
        offset += bytesToRead;
    });

    return result;
}

/**
 *
 * @param buffer
 * @returns {number}
 */
function CRC32(buffer) {
    let crc32 = 0xffffffff;

    buffer.forEach(b => {
        crc32 = Constants.CRC32_LOOKUP_TABLE[(crc32 ^ b) & 0xff] ^ (crc32 >>> 8);
    });

    crc32 = (crc32 ^ 0xffffffff) >>> 0;

    return (crc32 & 0xffffffff) >>> 0;
}

module.exports = {
    MergeDefaults,
    ReadRecord,
    CRC32
};