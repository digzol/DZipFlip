const {HfsPreset, ZipArchive} = require('dzipflip');

const path = require('path');
const fs = require('fs');

// i.e. node exampleSync.js "mySourceDir" "myTargetDir"
const sourceDir = process.argv[2];
const targetDir = process.argv[3];

function extractAllFromDir(dir) {
    console.time('Time elapsed');

    fs.readdir(dir, (err, files) => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }

        let fc = 0;

        for (let fn of files) {
            console.log('\nReading', fn, '...', `(${++fc}/${files.length})`);
            extractArchive(fn);
        }
    });
}

function extractArchive(file) {
    const source = path.join(sourceDir, file);
    const buffer = fs.readFileSync(source);
    const zip = ZipArchive.from(buffer, HfsPreset);

    for (let entry of zip.entries) {
        const fn = entry.filename;
        const fp = path.join(targetDir, fn);
        console.log('-', 'Extracting', fn, '...');
        fs.writeFileSync(fp, entry.fileContent);
    }
    console.timeLog('Time elapsed');
}

extractAllFromDir(sourceDir);