module.exports = {

    // Archives
    Archive: require('./lib/Archive'),
    ZipArchive: require('./lib/ZipArchive'),

    ArchiveEntry: require('./lib/ArchiveEntry'),
    ZipEntry: require('./lib/ZipEntry'),

    // Option presets
    BasePreset: require('./lib/presets/BasePreset'),
    ZipPreset: require('./lib/presets/ZipPreset'),
    HfsPreset: require('./lib/presets/HfsPreset'),
};