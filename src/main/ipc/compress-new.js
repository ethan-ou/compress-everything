const fs = require('fs');
const Queue = require('better-queue');
const path = require('path');
const JSZip = require("jszip");

const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const hbjs = require('handbrake-js');

const videoFileTypes = ['.mp4', '.MP4', '.mkv', '.MKV', '.mov', '.MOV', 'm4v', 'M4V'];
const photoFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.svg', '.SVG', '.gif', '.GIF'];
const webFileTypes = ['.html', '.css', '.js']
const powerpointFileTypes = ['.pptx'];
const OUTPUT_path = './output/';

const imageMinPlugins = [
    imageminMozjpeg({quality: 80}),
    imageminPngquant({quality: [0.6, 0.8]}),
    imageminGifsicle({optimizationLevel: 2}),
    imageminSvgo({ plugins: [ {
      removeTitle: true,
      removeDimensions: true
    } ]})
];

export default class Compress {
    constructor() {

    }

    filterFiletypes(files) {
        for (const file of files) {
            let photoFiles = files.filter((file) => {
                if (photoFileTypes.includes(path.extname(file))) { return file };
            });
            let videoFiles = files.filter((file) => {
                if (videoFileTypes.includes(path.extname(file))) { return file };
            });
            let webFiles = files.filter((file) => {
                if (webFileTypes.includes(path.extname(file))) { return file };
            })

            return {
                photo: photoFiles,
                video: videoFiles,
                web: webFiles
            };
        }
    }

    addToQueue(event, files) {
        const {first, second} = getValues();
    }

}