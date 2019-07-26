const compress_images = require('compress-images');
const fs = require('fs');
const path = require('path');
const Queue = require('better-queue');

const JSZip = require("jszip");
const hbjs = require('handbrake-js');

const INPUT_path_to_your_images = 'src/img/*.{jpg,JPG,jpeg,JPEG,png,PNG,svg,SVG,gif,GIF}';
const INPUT_path_to_your_videos = 'src/img/';

const videoFileTypes = ['.mp4', '.MP4', '.mkv', '.MKV', '.mov', '.MOV'];
const photoFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.svg', '.SVG', '.gif', '.GIF'];

const OUTPUT_path = 'build/img/';

export default class Compress {
    constructor() {
        this.videoQueue = new Queue(function (file, endTask) {
            hbjs.spawn({ 
                input: INPUT_path_to_your_videos + path.basename(file), 
                output: OUTPUT_path + path.basename(file), 
                preset: 'Vimeo YouTube HQ 1080p60' })
            .on('error', console.error)
            .on('progress', progress => {
                console.log(
                'Percent complete: %s, ETA: %s',
                progress.percentComplete,
                progress.eta
                )})
            .on('end', () => {
                console.log("Done!");
                endTask();
            });
        }, { batchSize: 1, concurrent: 1 });
        
        this.photoQueue = new Queue(function (file, endTask) {
            compress_images(INPUT_path_to_your_images, OUTPUT_path, {compress_force: false, statistic: true, autoupdate: true}, false,
                {jpg: {engine: 'mozjpeg', command: ['-quality', '80']}},
                {png: {engine: 'pngquant', command: ['--quality=50-70']}},
                {svg: {engine: 'svgo', command: '--multipass'}},
                {gif: {engine: 'gifsicle', command: ['--colors', '256', '--use-col=web']}}, function(){
            });
        });

    }
    
    addToQueue(files) {
        fs.readdirSync(files).forEach(file => {
            // if (videoFileTypes.includes(path.extname(file))) {
            //     videoQueue.push(file);   
            // }

            // if (imageFileTypes.includes(path.extname(file))) {
            //     photoQueue.push(file);
            // }
            console.log(file);
        });
    }
