module.exports = class ArchiveEntry {
    constructor() {
        this.versionBy = 0;
        this.versionReq = 0;
        this.bitFlag = 0;
        this.lastModTime = 0;
        this.lastModDate = 0;
        this.internalAttribs = 0;
        this.externalAttribs = 0;

        this.name = null;
        this.extraField = null;
        this.comment = null;
        this.content = null;
    }

    get filename() {
        return String.fromCharCode(...this.name);
    }
};