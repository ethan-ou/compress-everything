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
                result = new CleanCSS(CleanCSSSettings).minify(data).styles;
            }
            if (mime.getType(file) === "text/javascript" || mime.getType(file) === "application/javascript") {
                console.log("Error:", Terser.minify(data).error)
                result = Terser.minify(data).code;
            }
            resolve(Buffer.from(result));
        } 
        catch (err) {
            reject(err);
        }
    });
}