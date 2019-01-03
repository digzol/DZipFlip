const Utils = require('../Utils');
const Constants = require('../Constants');
const ZipPreset = require('./ZipPreset');

const fs = require('fs');
const path = require('path');

// Reference: http://wiki.xentax.com/index.php/Vindictus

const cipherKey = fs.readFileSync(path.join(Constants.CIPHER_KEY_DIR, 'XorTruths.bin'));
const HfsOptions = {
    // record header signatures
    LocalFileHeaderSignature: 0x02014648,
    CentralDirectoryFileHeaderSignature: 0x02014648,
    EndOfCentralDirectoryHeaderSignature: 0x06054648,

    FileNameCipher: {method: 'GLOBAL_XOR_CIPHER', key: cipherKey},
    FileContentCipher: {method: 'GLOBAL_XOR_CIPHER', key: cipherKey},
};
module.exports = Utils.MergeDefaults(ZipPreset, HfsOptions);