const Utils = require('./Utils');
const BasePreset = require('./presets/BasePreset');

class Archive {


    /**
     *  Load and parse raw binaries and return a structured archive object
     *
     * @param buffer - The binaries of the raw source archive
     * @param readOptions - (optional) Specifications on how to read the raw source binaries
     * @param instance - The parent object to return
     * @return
     */
    static from(buffer, readOptions, instance) {
        const archive = new instance();

        archive.readBuffer(buffer, readOptions);

        return archive;
    }

    constructor() {
        this.entries = null;
    }

    readBuffer() {
        console.error('Error:', 'readBuffer() is not defined.');
        process.exit(1);
    }

    allocLocalFiles(size) {
        this.entries = new Array(size);
    }

    setLocalFile(index, file) {
        this.entries[index] = file;
    }
}

module.exports = Archive;