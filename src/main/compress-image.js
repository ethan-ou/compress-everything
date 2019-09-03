const fs = require('fs-extra');
const path = require('path');
const mime = require('mime');
const fileType = require('file-type');

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
    return new Promise(async (resolve, reject) => {
        try {
            const fileBuffer = await fs.readFile(file);
            if (fileType(fileBuffer) === undefined) reject(new Error("File is not an image."));

            let compressedFileBuffer;
            if (resizeImages) compressedFileBuffer = await resizeImage(fileBuffer, path.extname(file));
            else compressedFileBuffer = fileBuffer;

            const processedFile = await compressImageBuffer(compressedFileBuffer);
            await fs.writeFile(OUTPUT_path + path.basename(file), processedFile)
                .then(() => resolve("Done"))
        } 
        catch (err) {
            reject(err);
        }
    });
}

export async function compressImageBuffer(buffer, file, resize = true) {
    return new Promise(async (resolve, reject) => {
        try {
            if (fileType(buffer) === undefined) reject(new Error("File is not an image."));
            console.log(file);
            const resizedImage = await resizeImage(buffer, file, resize);
            const processed = await imagemin.buffer(resizedImage, { plugins: imageMinPlugins });
            resolve(processed);
        } catch (err) {
            reject(err);
        }
    });
}

async function resizeImage(buffer, file, resize) {
    return new Promise(async (resolve, reject) => {
        let mimeType;
        if (!resizeImages || !resize || mime.getType(file) !== "image/jpeg" && mime.getType(file) !== "image/png") return resolve(buffer);
        if (mime.getType(file) === "image/jpeg") mimeType = Jimp.MIME_JPEG;
        if (mime.getType(file) === "image/png") mimeType = Jimp.MIME_PNG;
        const image = await Jimp.read(buffer)
            .then(image => {
                // UNFIXED: Found bug where if image has EXIF data, it will crop with black bars.
                image.scaleToFit(resizeImages[0], resizeImages[1], Jimp.RESIZE_BICUBIC);
                return image.getBufferAsync(mimeType);
            })
            .catch(err => {
                reject(err)
            });

        resolve(image);
    });
}