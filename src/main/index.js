import 'core-js/proposals/promise-all-settled'
import fs from 'fs-extra';
import mime from 'mime';
import PQueue from 'p-queue';

import { compressZip } from './zip-handler';
import { compressImages, compressImageBuffer } from './compress-image';
import { compressVideos } from './compress-video';
import { compressText, compressTextBuffer } from './compress-text';

import { acceptedTypes } from '../constants/types';

const asyncQueue = new PQueue({concurrency: 3});
const asyncQueueZip = new PQueue({concurrency: 3});
const queue = new PQueue({concurrency: 1});

export async function addToQueue(event, state) {
    return handleFiles(state.files, state.options);
}

async function handleFiles(files, options) {
    console.log("Number of files:", files.length);
    console.log(files);
    console.log(options);
    fs.ensureDir(options.outputPath, err => {
        console.log(err)
    })  

    const sortedFiles = await sortFiles(files);
    if (sortedFiles.rejected) console.log(`Rejected ${sortedFiles.rejected}`);

    const results = await Promise.allSettled([
        await queueFileType(sortedFiles.image, asyncQueue, compressImages, options),
        await queueFileType(sortedFiles.text, asyncQueue, compressText, options),
        await queueFileType(sortedFiles.video, queue, compressVideos, options),
        await queueFileType(sortedFiles.zip, asyncQueueZip, compressZip, options),
    ]).then((values) => {
        console.log(values);
    })
    console.log(`Queue size: ${asyncQueue.size}`);
    console.log(`Queue size: ${queue.size}`);

    return results;
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
    await files.map(async file => queueType.add(async () => callback(file, options)));
}

function filterFiles(files, fileType) {
    return files.filter(file => acceptedTypes[mime.getType(file)] === fileType);
}

// async function openFile(file, options) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const fileBuffer = await fs.readFile(file)
//             let compressedFileBuffer;
//             if (options.type == "image") compressedFileBuffer = await compressImageBuffer(fileBuffer, file, options);
//             if (options.type == "text") compressedFileBuffer = await compressTextBuffer(fileBuffer, file, options);
//             await fs.writeFile(OUTPUT_path + path.basename(file), compressedFileBuffer)
//                 .then(() => resolve("Done"));
//         }
//         catch (err) {
//             reject(err);
//         }
//     })
// }

