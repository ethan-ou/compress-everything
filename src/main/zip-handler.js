const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const mime = require('mime');

import { sortFiles } from './index';
import { compressImageBuffer } from './compress-image';
import { compressVideos } from './compress-video';
import { compressTextBuffer } from './compress-text';

import { OUTPUT_path, resizeImages } from '../constants/settings';

export async function compressZip(file) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = fs.readFile(file);
            const zip = await JSZip.loadAsync(fileBuffer);
            const allFiles = Object.keys(zip.files);
            const sortedFiles = await sortFiles(allFiles);

            //Avoid resizing for files that may be displayed on the web.
            let setResize = true;
            if (sortedFiles.text == true || mime.getType(file) === "application/epub") setResize = false;

            const processedZip = await processZip(zip, sortedFiles, { resize: setResize })

            processedZip.generateNodeStream({
                streamFiles: true,
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9,
                },
            })
            .pipe(fs.createWriteStream(OUTPUT_path + path.basename(file)))
            .on("finish", () => {
                console.log(path.basename(file), "written.");
                resolve("done");
            });
        }
        catch (err) {
            reject(err)
        }
    });
    return promise;
}


async function processZip(zip, files, options) {
    const originalZip = zip;
    const processedZip1 = await processZipFileType(originalZip, files.image, compressImageBuffer, options.resize);
    const processedZip2 = await processZipFileType(processedZip1, files.text, compressTextBuffer);
    return processedZip2;
}

async function processZipFileType(zip, files, callback, options) {
    //Used traditional for-loop since async methods returned errors.
    for (const file of files) {
        const data = await zip
            .file(file)
            .async('nodebuffer', metadata => console.log(`progression: ${metadata.percent.toFixed(2)} %`));
    
        const processedContent = await callback(data, file, options);
    
        console.log('File:', files.indexOf(file) + 1, 'of', files.length);
        zip.file(file, processedContent, { binary: true });
    }
    return zip;
}