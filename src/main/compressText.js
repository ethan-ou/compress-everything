import fs from 'fs-extra';
import mime from 'mime';

import Terser from 'terser';
import CleanCSS from 'clean-css';
import { minify as HTMLminify } from 'html-minifier';

import { setOutputType, HTMLMinifySettings, CleanCSSSettings } from '../constants/settings'

export async function compressText(file, options) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = await fs.readFile(file);
            const processedFile = await compressTextBuffer(fileBuffer, file, options);
            await fs.writeFile(setOutputType(options, file), processedFile)
                .then(() => resolve("Done"))
        } 
        catch (err) {
            reject(err);
        }
    });
}

export async function compressTextBuffer(buffer, file, options) {
    return new Promise(async (resolve, reject) => {
        try {
            const data = buffer.toString();
            let result;     
            if (mime.getType(file) === "text/html") {
                result = HTMLminify(data, HTMLMinifySettings);
            }
            if (mime.getType(file) === "text/css") {
                console.log("Error:", new CleanCSS(CleanCSSSettings).minify(data).errors);
                console.log("Warning:", new CleanCSS(CleanCSSSettings).minify(data).warnings);
                result = new CleanCSS(CleanCSSSettings).minify(data).styles;
                if (result === '') resolve(buffer);
            }
            if (mime.getType(file) === "text/javascript" || mime.getType(file) === "application/javascript") {
                if (Terser.minify(data).error) {
                    console.log(Terser.minify(data).error);
                    resolve(buffer);
                }
                result = Terser.minify(data).code;
            }
            resolve(Buffer.from(result));
        } 
        catch (err) {
            reject(err);
        }
    });
}