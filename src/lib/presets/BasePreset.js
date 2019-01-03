const BaseOptions = {
    // record header signatures
    LocalFileHeaderSignature: 0,
    CentralDirectoryFileHeaderSignature: 0,
    EndOfCentralDirectoryHeaderSignature: 0,

    // record byte sizes
    LocalFileRecordSizes: [],
    CentralDirectoryFileRecordSizes: [],
    EndOfCentralDirectoryRecordSizes: [],

    EndOfCentralDirectoryMinSize: 0,
    EndOfCentralDirectoryMaxSize: 0,
};
module.exports = BaseOptions;