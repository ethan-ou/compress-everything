import 'core-js/proposals/promise-all-settled'
import fs from 'fs-extra';
import PQueue from 'p-queue';

import { compressZip } from './compressZip';
import { compressImages } from './compressImage';
import { compressVideos } from './compressVideo';
import { compressText } from './compressText';
import { sortFiles, queueFiles, queueFile, filterFiles, filterFile } from './utils'

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

    const results = await Promise.allSettled(files.map(async file => {
        if (filterFile(file, "image")) {
            return queueFile(file, options, compressImages, asyncQueue);
        }
        if (filterFile(file, "text")) {
            return queueFile(file, options, compressText, asyncQueue);
        }
        if (filterFile(file, "video")) {
            return queueFile(file, options, compressVideos, queue);
        }
        if (filterFile(file, "zip")) {
            return queueFile(file, options, compressZip, asyncQueueZip);
        }
        if (filterFile(file, undefined)) {
            return Promise.reject(0);
        }
    })).then(values => console.log(values));
    
    return results;

    // const sortedFiles = await sortFiles(files);
    // if (sortedFiles.rejected) console.log(`Rejected ${sortedFiles.rejected}`);

    // const results = await Promise.allSettled([
    //     await queueFileType(sortedFiles.image, options, compressImages, asyncQueue),
    //     await queueFileType(sortedFiles.text, options, compressText, asyncQueue),
    //     await queueFileType(sortedFiles.video, options, compressVideos, queue),
    //     await queueFileType(sortedFiles.zip, options, compressZip, asyncQueueZip),
    // ]).then((values) => {
    //     console.log(values);
    // })
    // console.log(`Queue size: ${asyncQueue.size}`);
    // console.log(`Queue size: ${queue.size}`);

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

