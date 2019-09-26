import fs from 'fs-extra';
import mime from 'mime';
// import sharp from 'sharp';

import imagemin from 'imagemin';
import Jimp from 'jimp';

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
        let mimeType;
        console.log(options);
        if (!options.resize || options.zipHasWebFiles || mime.getType(file) !== "image/jpeg" && mime.getType(file) !== "image/png") return resolve(buffer);
        if (mime.getType(file) === "image/jpeg") mimeType = Jimp.MIME_JPEG;
        if (mime.getType(file) === "image/png") mimeType = Jimp.MIME_PNG;
        
        const resizeImages = setImageSize(options);
        const image = await Jimp.read(buffer)
            .then(image => {
                // UNFIXED: Found bug where if image has EXIF data, it will crop with black bars.
                if (image.bitmap.width > resizeImages[0] || image.bitmap.height > resizeImages[1]) {
                    image.scaleToFit(resizeImages[0], resizeImages[1], Jimp.RESIZE_BICUBIC);
                }
                return image.getBufferAsync(mimeType);
            })
            .catch(err => {
                reject(err)
            });
        resolve(image);
    });
}

// async function resizeImage(buffer, file, options) {
//     return new Promise(async (resolve, reject) => {
//         if (!options.resize || options.zipHasWebFiles || mime.getType(file) !== "image/jpeg" && mime.getType(file) !== "image/png") return resolve(buffer);
//         const resizeImages = setImageSize(options);
        
//         const image = await sharp(buffer)
//             .rotate()
//             .resize(resizeImages[0], resizeImages[1], {
//                 fit: 'inside'
//             })
//             .then(image => {
//                 resolve(image);
//             })
//             .catch(err => {
//                 reject(err);
//             })
//     });
// }