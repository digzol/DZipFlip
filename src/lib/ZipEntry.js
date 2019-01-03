const Utils = require('./Utils');

module.exports = class ZipEntry extends require('./ArchiveEntry') {
    constructor() {
        super();
        this.crc32 = null;
        this.compressMethod = 0;
        this.compressedSize = null;
        this.uncompressedSize = null;
        this.dataDiskNum = 0;
    }

    updateCRC32(content) {
        this.crc32 = Utils.CRC32(content);
    }
};