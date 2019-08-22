const fs = require('fs-extra');
const path = require('path');
const mime = require('mime');

const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const Jimp = require('jimp');

const imageMinPlugins = [
    imageminMozjpeg({ quality: 80 }),
    imageminPngquant({ quality: [0.6, 0.8] }),
    imageminGifsicle({ optimizationLevel: 2 }),
    imageminSvgo({
        plugins: [
            {
                removeTitle: true,
                removeDimensions: true,
            },
        ],
    }),
];

import { OUTPUT_path, resizeImages } from '../constants/settings'

export async function compressImages(file) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = await fs.readFile(file)
            let compressedFileBuffer;
            
            if (resizeImages) compressedFileBuffer = await resizeImage(fileBuffer, path.extname(file));
            else compressedFileBuffer = fileBuffer

            const processedFile = await compressImageBuffer(compressedFileBuffer);
            await fs.writeFile(OUTPUT_path + path.basename(file), processedFile)
                .then(() => resolve("Done"))
        } 
        catch (err) {
            reject(err);
        }
    })
    
    return promise;
}

export async function compressImageBuffer(buffer, file, resize = true) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            console.log(buffer);
            const resizedImage = await resizeImage(buffer, file, resize);
            const processed = await imagemin.buffer(resizedImage, { plugins: imageMinPlugins });
            resolve(processed);
        } catch (err) {
            reject(err);
        }
    });

    return promise;
}

async function resizeImage(buffer, file, resize) {
    let mimeType;
    if (!resizeImages || mime.getType(file) !== "image/jpeg" || mime.getType(file) !== "image/png" || !resize) return buffer;
    if (mime.getType(file) === "image/jpeg") mimeType = Jimp.MIME_JPEG;
    if (mime.getType(file) === "image/png") mimeType = Jimp.MIME_PNG;
    
    const image = await Jimp.read(buffer)
        .then(image => {
            if (image.bitmap.width > resizeImages[0] || image.bitmap.height > resizeImages[1]) {
                image.scaleToFit(resizeImages[0], resizeImages[1], Jimp.RESIZE_BICUBIC);
            }
            return image.getBufferAsync(mimeType);
        })
        .catch(err => {
            console.error(err);
        });

    return image;
}