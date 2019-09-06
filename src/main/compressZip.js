import fs from 'fs-extra';
import mime from 'mime';
import path from 'path';
import JSZip from 'jszip';

import { sortFiles } from './utils';
import { compressImageBuffer } from './compressImage';
import { compressVideos } from './compressVideo';
import { compressTextBuffer } from './compressText';

import { setOutputType } from '../constants/settings';

export async function compressZip(file, options) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = await fs.readFile(file);
            const processedZip = await compressZipBuffer(fileBuffer, file, options);

            processedZip.generateNodeStream({
                streamFiles: true,
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9,
                },
            })
            .pipe(fs.createWriteStream(setOutputType(options, file)))
            .on("finish", () => {
                console.log(path.basename(file), "written.");
                resolve("done");
            });
        }
        catch (err) {
            reject(err)
        }
    });
}

export async function compressZipBuffer(buffer, file, options) {
    return new Promise(async (resolve, reject) => {
        try {
            const zip = await JSZip.loadAsync(buffer);
            const allFiles = Object.keys(zip.files);
            const sortedFiles = await sortFiles(allFiles);

            //Avoid resizing for files that may be displayed on the web.
            let zipHasWebFiles;
            if ((options.avoidResizeZip) && (sortedFiles.text || mime.getType(file) === "application/epub")) zipHasWebFiles = true;
            const processedZip = await processZip(zip, sortedFiles, {...options, zipHasWebFiles});
            resolve(processedZip)
        }
        catch (err) {
            reject(err)
        }
    });
}


async function processZip(zip, files, options) {
    await processZipFileType(zip, files.image, compressImageBuffer, options);
    await processZipFileType(zip, files.text, compressTextBuffer, options);
    return zip;
}

async function processZipFileType(zip, files, callback, options) {
    //Used traditional for-loop since async methods returned errors.
    for (const file of files) {
        const buffer = await zip
            .file(file)
            .async('nodebuffer', metadata => console.log(`progression: ${metadata.percent.toFixed(2)} %`));
    
        const processedContent = await callback(buffer, file, options);
    
        console.log('File:', files.indexOf(file) + 1, 'of', files.length);
        zip.file(file, processedContent, { binary: true });
    }
    return zip;
}