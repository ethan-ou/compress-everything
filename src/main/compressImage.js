import fs from 'fs-extra';
import mime from 'mime';
import sharp from 'sharp';
import imagemin from 'imagemin';

import { setImageSize, setOutputType, imageMinPlugins } from '../constants/settings'

export async function compressImages(file, options) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = await fs.readFile(file);
            const processedFile = await compressImageBuffer(fileBuffer, file, options);
            await fs.writeFile(setOutputType(options, file), processedFile)
                .then(() => resolve("Done"))
        } 
        catch (err) {
            reject(err);
        }
    });
}

export async function compressImageBuffer(buffer, file, options) {
    return new Promise(async (resolve, reject) => {
        try {
            const resizedImage = await resizeImage(buffer, file, options);
            const processed = await imagemin.buffer(resizedImage, { plugins: imageMinPlugins });
            resolve(processed);
        } catch (err) {
            reject(err);
        }
    });
}

async function resizeImage(buffer, file, options) {
    return new Promise(async (resolve, reject) => {
        if (!options.resize || options.zipHasWebFiles || mime.getType(file) !== "image/jpeg" && mime.getType(file) !== "image/png") return resolve(buffer);
        const resizeImages = setImageSize(options);
        const image = await sharp(buffer)
            .rotate()
            .resize(resizeImages[0], resizeImages[1], {
                fit: 'inside'
            })
            .toBuffer()
            .catch(err => {
                reject(err);
            });

        resolve(image);
    });
}