import hbjs from 'handbrake-js';
import { setOutputType } from '../constants/settings'

export async function compressVideos(file, options) {
    return new Promise(async (resolve, reject) => {
        hbjs.spawn({
            input: file,
            output: setOutputType(options, file),
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