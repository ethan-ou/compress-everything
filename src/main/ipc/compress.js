const fs = require('fs');
const Queue = require('better-queue');
const path = require('path');
const JSZip = require("jszip");
const hbjs = require('handbrake-js');
const compress_images = require('compress-images');

const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');


const videoFileTypes = ['.mp4', '.MP4', '.mkv', '.MKV', '.mov', '.MOV', 'm4v', 'M4V'];
const photoFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.svg', '.SVG', '.gif', '.GIF'];
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
    constructor(props, context) {
        this.addToQueue = this.addToQueue.bind(this);
        this.compressImages = this.compressImages.bind(this);
        this.compressVideos = this.compressVideos.bind(this);

        this.photoQueue = new Queue(function (files, endTask) {
            console.log("from photoQueue:", files);
            try {
                for (const file of files) {
                        //const originalBuffer = fs.readFileSync(file);
                            const image = imagemin([file], { 
                            destination: OUTPUT_path + path.basename(file),
                            plugins: imageMinPlugins })
                            .then(() => {
                                console.log('Images optimized');
                                console.log(image)
                                endTask();
                            });
                            
                }
              } catch (error) {
                console.error('Error: ', error);
              }
            // this.compressImages(file);
            // compress_images(file, OUTPUT_path + path.basename(file), {compress_force: false, statistic: true, autoupdate: true}, false,
            //     {jpg: {engine: 'mozjpeg', command: ['-quality', '80']}},
            //     {png: {engine: 'pngquant', command: ['--quality=50-70']}},
            //     {svg: {engine: 'svgo', command: '--multipass'}},
            //     {gif: {engine: 'gifsicle', command: ['--colors', '256', '--use-col=web']}},
            //     function(error, completed, statistic){
            //         console.log('-------------');
            //         console.log(error);
            //         console.log(completed);
            //         console.log(statistic);
            //         console.log('-------------');
            //         if (completed == true) {
            //             endTask();
            //         }
            //     });
            
            console.log("compress!")
            
        }, { batchSize: 10, concurrent: 10 })
        this.videoQueue = new Queue(function (file, endTask) {
            console.log("from videoQueue:", file)
            hbjs.spawn({ 
                input: file,
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
        }, { batchSize: 1, concurrent: 1 })
        
        
    }

    async addToQueue(event, files) {
        try {
            console.log(this.photoQueue);
            console.log("Number of files:", files.length);
            for (const file of files) {
                if (photoFileTypes.includes(path.extname(file))) {
                    // compress_images(file, OUTPUT_path + file.name, {compress_force: false, statistic: true, autoupdate: true}, false,
                    //     {jpg: {engine: 'mozjpeg', command: ['-quality', '80']}},
                    //     {png: {engine: 'pngquant', command: ['--quality=50-70']}},
                    //     {svg: {engine: 'svgo', command: '--multipass'}},
                    //     {gif: {engine: 'gifsicle', command: ['--colors', '256', '--use-col=web']}},
                    //     function(error, completed, statistic){
                    //         console.log('-------------');
                    //         console.log(error);
                    //         console.log(completed);
                    //         console.log(statistic);
                    //         console.log('-------------');
                    //     });
                    // await this.photoQueue.push(file)
                    await this.compressImages(file);   
                }
                if (videoFileTypes.includes(path.extname(file))) {
                    await this.videoQueue.push(file);   
                }
            }   
        }
        catch(error) {
            console.error('Error: ', error);
        }
    }

    // async compressImages(file) {
    //     console.log("From compress images", file)
    //     compress_images(file, OUTPUT_path + file.name, {compress_force: false, statistic: true, autoupdate: true}, false,
    //         {jpg: {engine: 'mozjpeg', command: ['-quality', '80']}},
    //         {png: {engine: 'pngquant', command: ['--quality=50-70']}},
    //         {svg: {engine: 'svgo', command: '--multipass'}},
    //         {gif: {engine: 'gifsicle', command: ['--colors', '256', '--use-col=web']}},
    //         function(error, completed, statistic){
    //             console.log('-------------');
    //             console.log(error);
    //             console.log(completed);
    //             console.log(statistic);
    //             console.log('-------------');
    //         });
    // }

    compressVideos(file, endTask) {
        hbjs.spawn({ 
            input: file,
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
    }

    async compressImages(file) {
        try {
            const originalBuffer = await fs.readFile(file, async function read(err, data) {
                if (err) {
                    throw err;
                }
                console.log(data);
                const image = await imagemin.buffer(data, { plugins: imageMinPlugins })
                console.log(image)
                await fs.writeFile(OUTPUT_path + path.basename(file), image, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log("Image Processed")
                });
            });
            

        } catch (error) {
          console.error('Error: ', error);
        }
      }

}












// addToQueue = (files) => {
//     files.forEach(file => {
//         if (videoFileTypes.includes(path.extname(file.name))) {
//             this.videoQueue.push(file);   
//         }
//         if (photoFileTypes.includes(path.extname(file.name))) {
//             this.photoQueue.push(file);   
//         }
//     })
// }








// this.videoQueue = new Queue(function (file, endTask) {
//     console.log("From videoQueue:", file.path);
//     hbjs.spawn({ 
//         input: file.path, 
//         output: OUTPUT_path + file.name, 
//         preset: 'Vimeo YouTube HQ 1080p60' })
//     .on('error', console.error)
//     .on('progress', progress => {
//         console.log(
//         'Percent complete: %s, ETA: %s',
//         progress.percentComplete,
//         progress.eta
//         )})
//     .on('end', () => {
//         console.log("Done!");
//         endTask();
//     });
// }, { batchSize: 1, concurrent: 1 });

// this.photoQueue = new Queue(function (file, endTask) {
//     console.log("From photoQueue:", file.path);
//     compress_images(file.path, OUTPUT_path + file.name, {compress_force: false, statistic: true, autoupdate: true}, false,
//         {jpg: {engine: 'mozjpeg', command: ['-quality', '80']}},
//         {png: {engine: 'pngquant', command: ['--quality=50-70']}},
//         {svg: {engine: 'svgo', command: '--multipass'}},
//         {gif: {engine: 'gifsicle', command: ['--colors', '256', '--use-col=web']}}, function(err, completed){
//             if(completed === true) {
//                 endTask();
//             }
//             if(err) {
//                 console.log(err);
//             }
//             console.log('-------------');
//             console.log(error);
//             console.log(completed);
//             console.log(statistic);
//             console.log('-------------');
//             });

// });