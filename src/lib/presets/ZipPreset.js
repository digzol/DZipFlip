const Utils = require('../Utils');
const BasePreset = require('./BasePreset');

// Reference: https://en.wikipedia.org/wiki/Zip_(file_format)#File_headers

const ZipOptions = {
    // record header signatures
    LocalFileHeaderSignature: 0x04034b50,
    CentralDirectoryFileHeaderSignature: 0x02014b50,
    EndOfCentralDirectoryHeaderSignature: 0x06054b50,

    EndOfCentralDirectoryMinSize: 22,
    EndOfCentralDirectoryMaxSize: 0xffff,
};
module.exports = Utils.MergeDefaults(BasePreset, ZipOptions);