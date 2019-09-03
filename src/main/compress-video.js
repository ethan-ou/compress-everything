const path = require('path');
const hbjs = require('handbrake-js');
import { OUTPUT_path, resizeImages } from '../constants/settings'

export async function compressVideos(file, options) {
    return new Promise(async (resolve, reject) => {
        hbjs.spawn({
            input: file,
            output: OUTPUT_path + path.basename(file),
            preset: "Vimeo YouTube HQ 1080p60",
        })
        .on("error", (err) => {
            reject(err);
        })
        .on("progress", (progress) => {
            console.log(
                "Percent complete: %s, ETA: %s",
                progress.percentComplete,
                progress.eta,
            );
        })
        .on("end", () => {
            console.log("Done!");
            resolve("Done");
        });
    });
}