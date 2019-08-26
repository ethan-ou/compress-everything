const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const mime = require('mime');
import PQueue from 'p-queue';

import { compressZip } from './zip-handler';
import { compressImages, compressImageBuffer } from './compress-image';
import { compressVideos } from './compress-video';
import { compressText, compressTextBuffer } from './compress-text';

import { acceptedTypes } from '../constants/types';
import { OUTPUT_path, resizeImages } from '../constants/settings';


const asyncQueue = new PQueue({concurrency: 4});
const queue = new PQueue({concurrency: 2});

export async function addToQueue(event, files) {
    console.log("Number of files:", files.length);
    console.log(files);

    fs.ensureDir(OUTPUT_path, err => {
        console.log(err)
    })  

    const sortedFiles = await sortFiles(files);
    await Promise.all([
        await queueFileType(sortedFiles.image, asyncQueue, openFile, "image"),
        await queueFileType(sortedFiles.text, asyncQueue, openFile, "text"),
        await queueFileType(sortedFiles.video, queue, compressVideos),
        await queueFileType(sortedFiles.zip, queue, compressZip),
    ])
    .catch(error => console.log(error))

    if (sortedFiles.rejected) console.log(`Rejected ${sortedFiles.rejected}`);
    console.log(`Queue size: ${asyncQueue.size}`);
    console.log(`Queue size: ${queue.size}`);
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

async function queueFileType(files, queueType, callback, options) {
    await files.map(async file => await queueType.add(async () => await callback(file, options)))
}

function filterFiles(files, fileType) {
    return files.filter(file => acceptedTypes[mime.getType(file)] === fileType);
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

