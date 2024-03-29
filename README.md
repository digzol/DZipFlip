# DZipFlip
Command line tool written in [Node.js](https://nodejs.org/en/) 10.13.0.

This tool is designed to read and write custom files that resemble the [Zip](https://en.wikipedia.org/wiki/Zip_(file_format)#Structure) format structure.

## Usage Example
Basic program converting and extracting every local entry from a single archive file.

```javascript
const {MyPreset, ZipArchive} = require('dzipflip');
const fs = require('fs');

const mySourceFile = "...";

const buffer = fs.readFileSync(mySourceFile);
const zip = ZipArchive.from(buffer, MyPreset);

for (let entry of zip.entries) {
    fs.writeFileSync(entry.filename, entry.fileContent);
}
```

For more examples, see [examples]().

## Issues
To submit an issue or suggestion, see [issues](https://github.com/digzol/DZipFlip/issues).

Issues or suggestions submitted anywhere else will get ignored.

## Contributions
Any contributions are very much welcomed as long as they are submitted as a [pull request](https://github.com/digzol/DZipFlip/pulls).

To facilitate the process, make sure you have submitted a corresponding ticket under [issues](https://github.com/digzol/DZipFlip/issues) describing in details what your contribution changes and other related issues it may solve.

## About
This tool is inspired by VZipFlip, a program written in C#.

However, it is not limited to a single zip-like structure and therefore can be useful in many different contexts.
DZipFlip is also several times faster to execute than its counterpart.

I chose Node.js as environment as a learning experiment, and because of its ease of use.

## Disclaimer
This application is under the MIT license.

This application is meant to provide a helpful tool in the context described. It is not meant to be used, nor should it be used, in a context where the user does not own, or have permission to read and/or alter the material being supplied to the application.
The authors of this application are not responsible in which context this tool is used and are not liable for any damages or negative consequences resulting from the use of the tools provided by this application. Information provided under the "presets" section of this application are templates meant to be used as reference purposes by the application and said information is not meant to contain, nor should it contain, any copyrighted material, passwords, or otherwise illicit content. By using this application, the user agrees to the terms above.

Reference to Hfs file structure is provided under the "presets" section and its structure is used as an example and for informative and educational purposes. The authors do not claim ownership over the Hfs file structure and this application is not meant to be used on such files if the user does not have appropriate permissions.
