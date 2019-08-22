const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const JSZip = require('jszip');
const extract = require('extract-zip');
const readdirp = require('readdirp');
const mime = require('mime');
import PQueue from 'p-queue';

import { compressImages, compressImageBuffer } from './compress-image';
import { compressVideos } from './compress-video';
import { compressText, compressTextBuffer } from './compress-text';

import { acceptedTypes } from '../constants/types';
import { OUTPUT_path, resizeImages } from '../constants/settings';

const asyncQueue = new PQueue({concurrency: 3});
const queue = new PQueue({concurrency: 1});

export async function addToQueue(event, files) {
    console.log("Number of files:", files.length);
    console.log(files);

    fs.ensureDir(OUTPUT_path, err => {
        console.log(err)
    })  

    const sortedFiles = await sortFiles(files);
    console.log(sortedFiles);
    // await Promise.all([
    //     sortedFiles.image.map(async file => await asyncQueue.add(async () => await openFile(file, "image"))),
    //     sortedFiles.text.map(async file => await asyncQueue.add(async () => await openFile(file, "text"))),
    //     sortedFiles.video.map(async file => await queue.add(async () => await compressVideos(file))),
    //     sortedFiles.zip.map(async file => await queue.add(async () => await compressZip(file)))
    // ])
    // .then(values => console.log("Done!", values))
    // .catch(error => console.log(error))
    
    await Promise.all([
        await queueFileType(sortedFiles.image, asyncQueue, openFile, "image"),
        await queueFileType(sortedFiles.text, asyncQueue, openFile, "text"),
        await queueFileType(sortedFiles.video, queue, compressVideos),
        await queueFileType(sortedFiles.zip, queue, compressZip),
    ])
    .then(values => console.log("Done!", values))
    .catch(error => console.log(error))

    if (sortedFiles.rejected) console.log(`Rejected ${sortedFiles.rejected}`);
    console.log(`Queue size: ${asyncQueue.size}`);
    console.log(`Queue size: ${queue.size}`);
}

async function queueFileType(files, queueType, callback, options) {
    await files.map(async file => await queueType.add(async () => await callback(file, options)))
}

function filterFiles(files, fileType) {
    files.filter(file => console.log(mime.getType(file)))
    return files.filter(file => acceptedTypes[mime.getType(file)] === fileType);
}

export function sortFiles(files) {
    const image = filterFiles(files, "image");
    const video = filterFiles(files, "video");
    const text = filterFiles(files, "text");
    const zip = filterFiles(files, "zip");
    const rejected = filterFiles(files, undefined);
    return {
        image,
        video,
        text,
        zip,
        rejected
    }
}

async function openFile(file, type) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = await fs.readFile(file)
            let compressedFileBuffer;
            if (type == "image") compressedFileBuffer = await compressImageBuffer(fileBuffer, file);
            if (type == "text") compressedFileBuffer = await compressTextBuffer(fileBuffer, file);
            await fs.writeFile(OUTPUT_path + path.basename(file), compressedFileBuffer)
                .then(() => resolve("Done"));
        }
        catch (err) {
            reject(err);
        }
    })
    return promise;
}

async function compressZip(file) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = fs.readFile(file);
            const zip = await JSZip.loadAsync(fileBuffer);
            const allFiles = Object.keys(zip.files);
            const sortedFiles = await sortFiles(allFiles);
            console.log(sortedFiles);
            //Avoid resizing for files that may be displayed on the web.
            let setResize = true;
            if (sortedFiles.text == true || mime.getType(file) === "application/epub") setResize = false;

            const processedZip = await processZip(zip, sortedFiles, { resize: setResize });

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
    processZipFileType(zip, files.image, compressImageBuffer, options.resize);
    processZipFileType(zip, files.text, compressTextBuffer);
    return zip;
}

async function processZipFileType(zip, files, callback, options) {
    files.forEach(async file => {
        const data = await zip
            .file(file)
            .async("nodebuffer", metadata => console.log(`progression: ${metadata.percent.toFixed(2)} %`));
        const processedData = await callback(data, file, options);
        zip.file(file, processedData, { binary: true });
    });
    return zip;
}