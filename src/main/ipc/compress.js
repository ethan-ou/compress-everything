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
const Jimp = require('jimp');

const videoFileTypes = ['.mp4', '.MP4', '.mkv', '.MKV', '.mov', '.MOV', 'm4v', 'M4V'];
const photoFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.svg', '.SVG', '.gif', '.GIF'];
const photoResizeFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG'];
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
    constructor(props, context) {
        this.addToQueue = this.addToQueue.bind(this);
        this.compressImages = this.compressImages.bind(this);
        this.compressVideos = this.compressVideos.bind(this);
        this.compressPowerpoint = this.compressPowerpoint.bind(this);
        this.filterFileTypes = this.filterFileTypes.bind(this);

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
            console.log("Number of files:", files.length);
            console.log(files)
            for (const file of files) {
                if (photoFileTypes.includes(path.extname(file))) {
                    await this.compressImages(file);   
                }
                if (videoFileTypes.includes(path.extname(file))) {
                    await this.videoQueue.push(file);   
                }
                if (powerpointFileTypes.includes(path.extname(file))) {
                    await this.compressPowerpoint(file);
                }
            }   
        }
        catch(error) {
            console.error('Error:', error);
        }
    }

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
            await fs.readFile(file, async function read(err, data) {
                if (err) throw err;
                console.log(data);
                let image = await imagemin.buffer(data, { plugins: imageMinPlugins })
                console.log(image)
                await fs.writeFile(OUTPUT_path + path.basename(file), image, function(err) {
                    if (err) throw err;
                    console.log("Image Processed")
                });
            });
        } catch(error) {
          console.error('Error: ', error);
        }
      }

    async compressPowerpoint(file) {
        let mediaFiles = [];
        fs.readFile(file, function(err, data) {
            if (err) throw err;
            JSZip.loadAsync(data).then(async (zip) => {
                let allFiles = Object.keys(zip.files);
                let filteredFiles = await this.filterFileTypes(allFiles);
                let photoFiles = allFiles.filter((file) => {
                    if (photoFileTypes.includes(path.extname(file))) { return file };
                });
                // let videoFiles = allFiles.filter((file) => {
                //     if (videoFileTypes.includes(path.extname(file))) { return file };
                // })
         
                console.log("Object.keys:", allFiles);
                console.log("Photo Files:", photoFiles);
                console.log("Filtered Files:", filteredFiles);

                zip.folder("ppt/media").forEach((relativePath, file) => {
                    if (photoFileTypes.includes(path.extname(relativePath))) {
                        mediaFiles.push(relativePath);
                    }
                });
                console.log("Number of files:", mediaFiles.length);
                
                for (const file of mediaFiles) {
                    //console.log(zip.file("ppt/media/" + file).async("nodebuffer"))
                    console.log(file);
                    //console.log(mediaFiles);
                    await zip.file("ppt/media/" + file).async("nodebuffer", function updateCallback(metadata) {
                        console.log("progression: " + metadata.percent.toFixed(2) + " %")
                    }).then(async (content) => {
                        let image = await imagemin.buffer(content, { plugins: imageMinPlugins })
                        console.log(image);
                        console.log("ppt/media/" + file)
                        console.log("1")
                        //Writes to memory representation of zip file
                        let zipFile = zip.file("ppt/media/" + file, image, {binary: true})
                        //console.log(zipFile)
                        //fs.writeFile("output/"+ file, image, function(err){/*...*/});
                        console.log("2");
                        
                        
                    })
                    console.log(file);
                    
                    //let image = await imagemin.buffer(buffer, { plugins: imageMinPlugins })
                    
                }

                //Saves memory representation to hard drive when all processing is done
                zip.generateAsync({type:"nodebuffer"})
                    .then(function(content) {
                            // Force down of the Zip file
                        fs.writeFile(OUTPUT_path + path.basename(file), content, function(err){/*...*/});
                    });
                // zip.folder("ppt/media").generateAsync({type: "nodebuffer"}).then(async function (content) {
                //     let image = await imagemin.buffer(content, { plugins: imageMinPlugins })
                //     console.log(image)
                //     //saveAs(content, "hello.zip");
                //   }, function updateCallback(metadata) {
                //     // print progression with metadata.percent and metadata.currentFile
                //   });
            });
        });
    }

    async compressZip(file) {
        fs.readFile(file, function(err, data) {
            if (err) throw err;
            JSZip.loadAsync(data).then(function (zip) {
              
              let files = Object.keys(zip.files);
         
              console.log(files);
            });
        });
    }

    filterFileTypes(files) {
        
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