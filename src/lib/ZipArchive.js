const Archive = require('./Archive');
const ZipEntry = require('./ZipEntry');
const Utils = require('./Utils');
const Ciphers = require('./Ciphers');
const BufferReadError = require('./errors/BufferReadError');
const BufferWriteError = require('./errors/BufferWriteError');

const ZipPreset = require('./presets/ZipPreset');

const pako = require('pako');

class ZipArchive extends Archive {

    /**
     *  Load and parse raw binaries and return a structured archive object
     *
     * @param buffer - The binaries of the raw source archive
     * @param readOptions - (optional) Extra specifications on how to read the raw source binaries
     * @returns {ZipArchive} An instantiated zip archive object
     */
    static from(buffer, readOptions) {
        return Archive.from(buffer, readOptions, this);
    }

    constructor() {
        super();

        this.comment = null;
    }

    readBuffer(buffer, options) {
        options = Utils.MergeDefaults(ZipPreset, options);

        try {
            this._parseBuffer(buffer, options);
        } catch (e) {
            if (e instanceof BufferReadError) {
                console.error(e.message);
                process.exit(1);
            } else {
                throw e;
            }
        }
    }

    getBuffer(options) {
        options = Utils.MergeDefaults(ZipPreset, options);

        try {
            if (this.buffer == null) {
                this._writeBuffer(options);
            }
            return this.buffer;
        } catch (e) {
            if (e instanceof BufferWriteError) {
                console.error(e.message);
                process.exit(1);
            } else {
                throw e;
            }
        }
    }

    _parseBuffer(source, options) {
        /* Start of the end of central directory (EOCD) parsing */

        const EOCDSignature = options.EndOfCentralDirectoryHeaderSignature;

        const searchBufferStart = options.EndOfCentralDirectoryMaxSize * -1;
        const searchBufferEnd = options.EndOfCentralDirectoryMinSize * -1;

        const EOCDSearchBuffer = source.slice(searchBufferStart);

        const EOCDOffset = EOCDSearchBuffer.lastIndexOf(EOCDSignature, searchBufferEnd);

        if (EOCDOffset === -1) {
            throw new BufferReadError('EOCD record could not be found.');
        }

        const EOCDRecord = EOCDSearchBuffer.slice(EOCDOffset);

        // Unsupported record entries
        // const diskNum = EOCDRecord.readUInt16LE(4);
        // const centralDirDiskNum = EOCDRecord.readUInt16LE(6);
        // const diskCentralDirRecordCount = EOCDRecord.readUInt16LE(8);
        const centralDirRecordCount = EOCDRecord.readUInt16LE(10);
        //const centralDirSize = EOCDRecord.readUInt32LE(12);
        const centralDirOffset = EOCDRecord.readUInt32LE(16);
        const commentLen = EOCDRecord.readUInt16LE(20);

        this.comment = EOCDRecord.slice(22, commentLen);

        /* End of end of central directory (EOCD) parsing */

        this.allocLocalFiles(centralDirRecordCount);

        /* Start of central directory parsing & associated local file */

        let readerOffset = centralDirOffset;

        // Loop through each central directory entry and insert parsed data from its local files
        for (let i = 0; i < centralDirRecordCount; i++) {
            // TODO: Dynamic search in case of data buffer between records
            let centralDirRecord = source.slice(readerOffset);

            if (centralDirRecord.readUInt32LE() !== options.CentralDirectoryFileHeaderSignature) {
                throw new BufferReadError('Incorrect central directory header signature found: 0x'
                    + centralDirRecord.readUInt32LE().toString(16));
            }

            const nameLen = centralDirRecord.readUInt16LE(28);
            const extraFieldLen = centralDirRecord.readUInt16LE(30);
            const commentLen = centralDirRecord.readUInt16LE(32);
            const localFileOffset = centralDirRecord.readUInt32LE(42);

            centralDirRecord = centralDirRecord.slice(0, 46 + nameLen + extraFieldLen + commentLen);

            const entry = new ZipEntry();

            entry.versionBy = centralDirRecord.readUInt16LE(4);
            entry.versionReq = centralDirRecord.readUInt16LE(6);
            entry.bitFlag = centralDirRecord.readUInt16LE(8);
            entry.compressMethod = centralDirRecord.readUInt16LE(10);
            entry.lastModTime = centralDirRecord.readUInt16LE(12);
            entry.lastModDate = centralDirRecord.readUInt16LE(14);
            entry.crc32 = centralDirRecord.readUInt32LE(16);
            entry.compressedSize = centralDirRecord.readUInt32LE(20);
            entry.uncompressedSize = centralDirRecord.readUInt32LE(24);
            // entry.dataDiskNum = centralDirRecord.readUInt16LE(34);
            entry.internalAttribs = centralDirRecord.readUInt16LE(36);
            entry.externalAttribs = centralDirRecord.readUInt32LE(38);
            entry.name = centralDirRecord.slice(46, 46 + nameLen);
            entry.extraField = centralDirRecord.slice(46 + nameLen, 46 + nameLen + extraFieldLen);
            entry.comment = centralDirRecord.slice(46 + nameLen + extraFieldLen);

            if ('CompressionMethod' in options) {
                entry.compressMethod = options.CompressionMethod;
            }

            if ('FileNameCipher' in options) {
                const cipherMethod = options.FileNameCipher.method;
                const cipherKey = options.FileNameCipher.key;

                Ciphers.applyCipher(cipherMethod, entry.name, cipherKey, readerOffset + 46);
            }

            readerOffset += 46 + nameLen + extraFieldLen + commentLen;

            /* Start of local file parsing */

            let localFileRecord = source.slice(localFileOffset);

            if (localFileRecord.readUInt32LE() !== options.LocalFileHeaderSignature) {
                throw new BufferReadError('Incorrect local file header signature found: 0x'
                    + localFileRecord.readUInt32LE().toString(16));
            }

            if (localFileRecord.readUInt16LE(4) !== entry.versionReq)
                throw new BufferReadError(`Required version mismatch.`);

            if (localFileRecord.readUInt16LE(6) !== entry.bitFlag)
                throw new BufferReadError(`Bit flag mismatch.`);

            if (!('CompressionMethod' in options) && localFileRecord.readUInt16LE(8) !== entry.compressMethod)
                throw new BufferReadError(`Compression method mismatch.`);

            if (localFileRecord.readUInt16LE(10) !== entry.lastModTime)
                throw new BufferReadError(`Last modification time mismatch.`);

            if (localFileRecord.readUInt16LE(12) !== entry.lastModDate)
                throw new BufferReadError(`Last modification date mismatch.`);

            if (localFileRecord.readUInt32LE(14) !== entry.crc32)
                throw new BufferReadError(`CRC-32 mismatch.`);

            if (localFileRecord.readUInt32LE(18) !== entry.compressedSize)
                throw new BufferReadError(`Compressed size mismatch.`);

            if (localFileRecord.readUInt32LE(22) !== entry.uncompressedSize)
                throw new BufferReadError(`Uncompressed size mismatch.`);

            if (localFileRecord.readUInt16LE(26) !== entry.name.length)
                throw new BufferReadError(`Name length mismatch.`);

            if (localFileRecord.readUInt16LE(28) !== entry.extraField.length)
                throw new BufferReadError(`Extra field length mismatch.`);

            localFileRecord = localFileRecord.slice(0, 30 + nameLen + extraFieldLen + entry.compressedSize);

            let chk_fileName = localFileRecord.slice(30, 30 + nameLen);
            let chk_extraField = localFileRecord.slice(30 + nameLen, 30 + nameLen + extraFieldLen);
            let entryFileData = localFileRecord.slice(30 + nameLen + extraFieldLen);

            if ('FileNameCipher' in options) {
                const cipherMethod = options.FileNameCipher.method;
                const cipherKey = options.FileNameCipher.key;

                Ciphers.applyCipher(cipherMethod, chk_fileName, cipherKey, localFileOffset + 30);
            }

            if (chk_fileName.compare(entry.name) !== 0) {
                throw new BufferReadError(`Name mismatch.`);
            }

            if (chk_extraField.compare(entry.extraField) !== 0) {
                throw new BufferReadError(`Extra field mismatch.`);
            }

            if ('FileContentCipher' in options) {
                const cipherMethod = options.FileContentCipher.method;
                const cipherKey = options.FileContentCipher.key;
                const dataOffset = localFileOffset + 30 + nameLen + extraFieldLen;

                Ciphers.applyCipher(cipherMethod, entryFileData, cipherKey, dataOffset)
            }

            // TODO:

            const entryDataHeader = entryFileData.slice(0, 8);

            if (entryDataHeader.toString().startsWith('comp')) {
                entry.fileContent = Buffer.from(pako.inflate(entryFileData.slice(8)));
                entry.content = Buffer.from(pako.deflateRaw(entry.fileContent));
            } else {
                entry.fileContent = entryFileData;
                entry.content = entryFileData;
            }

            entry.updateCRC32(entry.fileContent);


            /* End of local file parsing */

            this.setLocalFile(i, entry);
        }

        /* End of central directory parsing & associated local file */
    }

    _readLocalFiles(options) {
        this.entries.forEach((entry) => {
            const recordOffset = entry.__temp.dataOffset;
            const record = Utils.ReadRecord(this.buffer, recordOffset, ...options.LocalFileRecordSizes);

            const compressionMethod = options.CompressionMethod || entry.compressMethod;

            if (record[0] !== options.LocalFileHeaderSignature) {
                throw new BufferReadError('Incorrect local file header signature found: 0x' + record[0].toString(16));
            }

            if (record[1] !== entry.versionReq)
                throw new BufferReadError(`Required version mismatch. Found: ${record[1]}; Expected: ${entry.versionReq};`);

            if (record[2] !== entry.bitFlag)
                throw new BufferReadError(`Bit flag mismatch. Found: ${record[2]}; Expected: ${entry.bitFlag};`);

            if (compressionMethod !== entry.compressMethod)
                throw new BufferReadError(`Compression method mismatch. Found: ${record[3]}; Expected: ${entry.compressMethod};`);

            if (record[4] !== entry.lastModTime)
                throw new BufferReadError(`Last modification time mismatch.: ${record[4]}; Expected: ${entry.lastModTime};`);

            if (record[5] !== entry.lastModDate)
                throw new BufferReadError(`Last modification date mismatch.: ${record[5]}; Expected: ${entry.lastModDate};`);

            if (record[6] !== entry.crc32)
                throw new BufferReadError(`CRC-32 mismatch.: ${record[6]}; Expected: ${entry.crc32};`);

            if (record[7] !== entry.compressedSize)
                throw new BufferReadError(`Compressed size mismatch. Found: ${record[7]}; Expected: ${entry.compressedSize};`);

            if (record[8] !== entry.uncompressedSize)
                throw new BufferReadError(`Uncompressed size mismatch. Found: ${record[8]}; Expected: ${entry.uncompressedSize};`);

            if (record[9] !== entry.name.length)
                throw new BufferReadError(`Name length mismatch. Found: ${record[9]}; Expected: ${entry.name.length};`);

            if (record[10] !== entry.extraField.length)
                throw new BufferReadError(`Extra field length mismatch. Found: ${record[10]}; Expected: ${entry.extraField.length};`);

            const compressDataLen = record[7];
            const nameLen = record[9];
            const extraFieldLen = record[10];

            const nameOffset = recordOffset + 30;
            const extraFieldOffset = nameOffset + nameLen;
            const dataOffset = extraFieldOffset + extraFieldLen;

            const fileName = this.buffer.slice(nameOffset, nameOffset + nameLen);
            const extraField = this.buffer.slice(extraFieldOffset, extraFieldOffset + extraFieldLen);
            const entryData = this.buffer.slice(dataOffset, dataOffset + compressDataLen);

            if ('FileNameCipher' in options) {
                entry.applyCipher(options.FileNameCipher.name, options.FileNameCipher.key, fileName, nameOffset);
            }

            if ('FileContentCipher' in options) {
                entry.applyCipher(options.FileContentCipher.name, options.FileContentCipher.key, entryData, dataOffset);
            }

            if (fileName.toString() !== entry.name.toString())
                throw new BufferReadError(`Name mismatch. Found: ${fileName}; Expected: ${entry.name};`);

            if (extraField.toString() !== entry.extraField.toString())
                throw new BufferReadError(`Extra field mismatch. Found: ${extraField}; Expected: ${entry.extraField};`);

            const entryDataHeader = String.fromCharCode(...entryData.slice(0, 4));

            if (entryDataHeader === 'comp') {
                entry.fileContent = Buffer.from(pako.inflate(entryData.slice(8)));
                entry.content = Buffer.from(pako.deflateRaw(entry.fileContent));
            } else {
                entry.fileContent = entryData;
                entry.content = entryData;
            }

            entry.updateCRC32(entry.fileContent);
        });
    }

    _writeBuffer(options) {
        // Number of local files to be written
        const entryCount = this.entries.length;

        // Each Zip has, for each local file, a header and some data, a central directory header
        //      along with an end of central directory record
        const records = new Array(entryCount * 3 + 1);

        // The central directory file headers will require the offset of their local file header
        const entryOffsets = new Array(entryCount);

        // The index number of the next available record slot
        let rec = 0;

        // The offset pointer of where we are writing
        let position = 0;

        /* Start of local file writing */

        this.entries.forEach((entry, i) => {
            const fileName = entry.name;
            const extraField = entry.extraField;
            const entryData = entry.content;

            const recordHeader = Buffer.alloc(30);

            recordHeader.writeUInt32LE(options.LocalFileHeaderSignature, 0);
            recordHeader.writeUInt16LE(entry.versionReq, 4);
            recordHeader.writeUInt16LE(entry.bitFlag, 6);
            recordHeader.writeUInt16LE(options.CompressionMethod, 8);
            recordHeader.writeUInt16LE(entry.lastModTime, 10);
            recordHeader.writeUInt16LE(entry.lastModDate, 12);
            recordHeader.writeUInt32LE(entry.crc32, 14);
            recordHeader.writeUInt32LE(entryData.length, 18);
            recordHeader.writeUInt32LE(entry.fileContent.length, 22);
            recordHeader.writeUInt16LE(fileName.length, 26);
            recordHeader.writeUInt16LE(extraField.length, 28);

            records[rec++] = Buffer.concat([recordHeader, fileName, extraField]);
            records[rec++] = entryData;

            entryOffsets[i] = position;

            position += recordHeader.length + fileName.length + extraField.length + entryData.length;
        });

        /* End of local file writing */

        // The end of central directory record will require the start and size of the central directory

        const startOfCentralDirectory = position;

        /* Start of central directory writing */

        this.entries.forEach((entry, i) => {
            const fileName = entry.name;
            const extraField = entry.extraField;
            const fileComment = entry.comment;

            const recordHeader = Buffer.alloc(46);

            recordHeader.writeUInt32LE(options.CentralDirectoryFileHeaderSignature, 0);
            recordHeader.writeUInt16LE(entry.versionBy, 4);
            recordHeader.writeUInt16LE(entry.versionReq, 6);
            recordHeader.writeUInt16LE(entry.bitFlag, 8);
            recordHeader.writeUInt16LE(options.CompressionMethod, 10);
            recordHeader.writeUInt16LE(entry.lastModTime, 12);
            recordHeader.writeUInt16LE(entry.lastModDate, 14);
            recordHeader.writeUInt32LE(entry.crc32, 16);
            recordHeader.writeUInt32LE(entry.content.length, 20);
            recordHeader.writeUInt32LE(entry.fileContent.length, 24);
            recordHeader.writeUInt16LE(fileName.length, 28);
            recordHeader.writeUInt16LE(extraField.length, 30);
            recordHeader.writeUInt16LE(fileComment.length, 32);
            recordHeader.writeUInt16LE(entry.dataDiskNum, 34);
            recordHeader.writeUInt16LE(entry.internalAttribs, 36);
            recordHeader.writeUInt32LE(entry.externalAttribs, 38);
            recordHeader.writeUInt32LE(entryOffsets[i], 42);

            records[rec++] = Buffer.concat([recordHeader, fileName, extraField, fileComment]);

            position += recordHeader.length + fileName.length + extraField.length + fileComment.length;
        });

        /* End of central directory writing */

        /* Start of end of central directory record writing */

        const fileComment = this.comment;

        const EOCDRecord = Buffer.alloc(22);

        EOCDRecord.writeUInt32LE(options.EndOfCentralDirectoryHeaderSignature, 0);
        EOCDRecord.writeUInt16LE(0, 4); // Unsupported
        EOCDRecord.writeUInt16LE(0, 6); // Unsupported
        EOCDRecord.writeUInt16LE(entryCount, 8); // Unsupported
        EOCDRecord.writeUInt16LE(entryCount, 10);
        EOCDRecord.writeUInt32LE(position - startOfCentralDirectory, 12);
        EOCDRecord.writeUInt32LE(startOfCentralDirectory, 16);
        EOCDRecord.writeUInt16LE(fileComment.length, 20);

        records[records.length - 1] = Buffer.concat([EOCDRecord, fileComment]);

        position += EOCDRecord.length + fileComment.length;

        /* End of writing */

        return this.buffer = Buffer.concat(records);
    }
}

module.exports = ZipArchive;