const fs = require('fs');
const Queue = require('better-queue');
const path = require('path');
const tmp = require('tmp');
const JSZip = require('jszip');
const extract = require('extract-zip');
const readdirp = require('readdirp');

const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const Jimp = require('jimp');
const hbjs = require('handbrake-js');

const Terser = require('terser');
const CleanCSS = require('clean-css');
const HTMLminify = require('html-minifier').minify;

const videoFileTypes = ['.mp4', '.MP4', '.mkv', '.MKV', '.mov', '.MOV', 'm4v', 'M4V', '.mpeg', '.MPEG'];
const photoFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.svg', '.SVG', '.gif', '.GIF'];
const photoResizeFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG'];
const jpegFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG'];
const pngFileTypes = ['.png', '.PNG'];
const webFileTypes = ['.html', '.HTML', '.css', '.CSS', '.js', '.JS'];
const zipFileTypes = ['.zip', '.docx', '.pptx', '.xlsx', '.epub'];
const resizeZipFileTypes = ['.zip', '.docx', '.pptx', '.xlsx'];

const OUTPUT_path = './output/';

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

const HTMLMinifySettings = {
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: true,
    collapseWhitespace: true,
    includeAutoGeneratedTags: false,
    minifyCSS: true,
    minifyJS: true,
    minifyURLs: true,
    quoteCharacter: "'",
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeEmptyElements: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
};

const resizeImages = [2048, 2048];

export default class Compress {
    constructor() {
        this.addToQueue = this.addToQueue.bind(this);
        this.compressImages = this.compressImages.bind(this);
        this.compressImageBuffer = this.compressImageBuffer.bind(this);
        this.resizeImage = this.resizeImage.bind(this);
        this.compressVideos = this.compressVideos.bind(this);
        // this.compressVideoBuffer = this.compressVideoBuffer.bind(this);
        this.compressZipFileSystem = this.compressZipFileSystem.bind(this);
        this.compressWeb = this.compressWeb.bind(this);
        this.compressZip = this.compressZip.bind(this);
        this.compressZipExperimental = this.compressZipExperimental.bind(this);

        this.videoQueue = new Queue((file, endTask) => {
            console.log('from videoQueue:', file);
            hbjs.spawn({
                input: file,
                output: OUTPUT_path + path.basename(file),
                preset: 'Vimeo YouTube HQ 1080p60',
            })
                .on('error', console.error)
                .on('progress', (progress) => {
                    console.log(
                        'Percent complete: %s, ETA: %s',
                        progress.percentComplete,
                        progress.eta,
                    );
                })
                .on('end', () => {
                    console.log('Done!');
                    endTask();
                });
        }, { batchSize: 1, concurrent: 1 });

        this.compressVideoBuffer = new Queue((file, tmpDir, tmpName, endTask) => {
                hbjs.spawn({
                    input: tmpobj.name + tmpName,
                    output: tmpDir + path.basename(file),
                    preset: 'Vimeo YouTube HQ 1080p60',
                })
                    .on('error', console.error)
                    .on('progress', (progress) => {
                        console.log(
                            'Percent complete: %s, ETA: %s',
                            progress.percentComplete,
                            progress.eta,
                        );
                    })
                    .on('end', () => {
                        console.log('Done!');
                        endTask();
                    });
        }, { batchSize: 1, concurrent: 1 });
    }

    async addToQueue(event, files) {
        try {
            console.log('Number of files:', files.length);
            console.log(files);
            for (const file of files) {
                if (photoFileTypes.includes(path.extname(file))) {
                    await this.compressImages(file);
                }
                if (videoFileTypes.includes(path.extname(file))) {
                    await this.videoQueue.push(file);
                }
                if (webFileTypes.includes(path.extname(file))) {
                    await this.compressWeb(file);
                }
                if (zipFileTypes.includes(path.extname(file))) {
                    await this.compressZip(file);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    async compressImages(file) {
        try {
            const photoQueue = new Queue(async (file, endTask) => {
                await fs.readFile(file, async (err, data) => {
                    if (err) throw err;
                    let fileData = data;
                    if (resizeImages && photoResizeFileTypes.includes(path.extname(file))) {
                        fileData = await this.resizeImage(fileData, path.extname(file));
                    }
                    const processedFile = await this.compressImageBuffer(fileData);
                    await fs.writeFile(OUTPUT_path + path.basename(file), processedFile, (err) => {
                        if (err) throw err;
                        endTask();
                    });
                });
            }, { batchSize: 1, concurrent: 1 });
            photoQueue.push(file);
        } catch (err) {
            console.error(err);
        }
    }

    async compressImageBuffer(buffer) {
        try {
            return await imagemin.buffer(buffer, { plugins: imageMinPlugins });
        } catch (err) {
            console.error(err);
        }
    }

    async resizeImage(buffer, fileType) {
        let mime = null;
        if (jpegFileTypes.includes(fileType)) mime = Jimp.MIME_JPEG;
        if (pngFileTypes.includes(fileType)) mime = Jimp.MIME_PNG;
        const image = await Jimp.read(buffer)
            .then((image) => {
                if (image.bitmap.width > resizeImages[0] || image.bitmap.height > resizeImages[1]) {
                    image.scaleToFit(resizeImages[0], resizeImages[1], Jimp.RESIZE_BICUBIC);
                }
                return image.getBufferAsync(mime);
            })
            .catch((err) => {
                console.error(err);
            });

        return image;
    }

    async compressVideos(file, endTask) {
        // add promise here

        hbjs.spawn({
            input: file,
            output: OUTPUT_path + path.basename(file),
            preset: 'Vimeo YouTube HQ 1080p60',
        })
            .on('error', console.error)
            .on('progress', (progress) => {
                console.log(
                    'Percent complete: %s, ETA: %s',
                    progress.percentComplete,
                    progress.eta,
                );
            })
            .on('end', () => {
                console.log('Done!');
                endTask();
            });
    }

    async compressWeb(file) {
        try {
            await fs.readFile(file, async (err, data) => {
                if (err) throw err;
                const processedFile = await this.compressWebBuffer(data, file);
                await fs.writeFile(OUTPUT_path + path.basename(file), processedFile, err => console.error(err));
            });
        } catch (err) {
            console.error('Error: ', err);
        }
    }

    async compressWebBuffer(buffer, file) {
        const webText = buffer.toString('utf-8');
        let result = null;
        if (path.extname(file) === '.html') {
            result = HTMLminify(webText, HTMLMinifySettings);
        }
        if (path.extname(file) === '.css') {
            result = new CleanCSS({ level: 2 }).minify(webText).styles;
        }
        if (path.extname(file) === '.js') {
            result = Terser.minify(webText).code;
        }
        return Buffer.from(result, 'utf-8');
    }

    async compressZip(file) {
        const isResizeFile = resizeZipFileTypes.includes(path.extname(file)) ? true : false;
        console.log(isResizeFile);
        fs.readFile(file, async (err, data) => {
            if (err) throw err;

            const zip = await JSZip.loadAsync(data);
            const allFiles = Object.keys(zip.files).filter((file) => {
                if (photoFileTypes.includes(path.extname(file))) {
                    return file;
                }
                if (videoFileTypes.includes(path.extname(file))) {
                    return file;
                }
                if (webFileTypes.includes(path.extname(file))) {
                    return file;
                }
            });
            
            console.log('Number of Files:', allFiles.length);

            const containsWebFile = allFiles.find((file) => {
                if (webFileTypes.includes(path.extname(file))) {
                    return file;
                }
            })? true : false;

            console.log(containsWebFile);


            for (const file of allFiles) {
                const content = await zip
                    .file(file)
                    .async('nodebuffer', metadata => console.log(`progression: ${metadata.percent.toFixed(2)} %`));

                let processedContent = null;
                if (photoFileTypes.includes(path.extname(file))) {
                    let data = content;
                    if (resizeImages && photoResizeFileTypes.includes(path.extname(file)) && isResizeFile && !containsWebFile) {
                        console.log("Resizing");
                        data = await this.resizeImage(data, path.extname(file));
                    }
                    processedContent = await this.compressImageBuffer(data);
                }

                if (videoFileTypes.includes(path.extname(file))) {
                    // Still need to process video content in handbrake
                    // const tmpobj = tmp.dirSync();
                    // const tmpName = tmp.tmpNameSync();
                    // console.log(tmpName);
                    // await fs.writeFile(tmpobj.name + tmpName, content, (err) => {console.error(err)});

                    // await this.compressVideoBuffer.push(file, tmpobj.name, tmpName);
                    // processedContent = fs.readFileSync(tmpobj.name + path.basename(file))
                    // zip
                    // .file(file)
                    // .nodeStream()
                    // .pipe(fs.createWriteStream('/tmp/my_text.txt'))
                    // .on('finish', function () {
                    //     // JSZip generates a readable stream with a "end" event,
                    //     // but is piped here in a writable stream which emits a "finish" event.
                    //     console.log("text file written.");
                    // });
                    processedContent = content;
                }

                if (webFileTypes.includes(path.extname(file))) {
                    processedContent = await this.compressWebBuffer(content, file);
                }

                console.log('File:', allFiles.indexOf(file) + 1, 'of', allFiles.length);
                zip.file(file, processedContent, { binary: true });
            }

            zip.generateNodeStream({
                streamFiles: true,
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9,
                },
            })
                .pipe(fs.createWriteStream(OUTPUT_path + path.basename(file)))
                .on('finish', () => {
                    console.log(path.basename(file), 'written.');
                });

            // const zipContent = await zip.generateAsync({type:"nodebuffer", compression: "DEFLATE", }, metadata => {
            //   console.log("progression: " + metadata.percent.toFixed(2) + " %")})
            // fs.writeFile(OUTPUT_path + path.basename(file), zipContent, function(err){/*...*/});

            // tmpobj.removeCallback();
        });
    }

    async compressZipFileSystem(file) {
        tmp.dir(async (err, tempPath, cleanupCallback) => {
            if (err) throw err;
           
            console.log('Dir: ', path);

            await extract(file, {dir: tempPath}, async (err) => {
                if (err) throw err;
                const tempFiles = await readdirp.promise(tempPath);
                const allFiles = tempFiles.map(file => file.path).filter((file) => {
                    if (photoFileTypes.includes(path.extname(file))) {
                        return file;
                    }
                    if (videoFileTypes.includes(path.extname(file))) {
                        return file;
                    }
                    if (webFileTypes.includes(path.extname(file))) {
                        return file;
                    }
                });
                console.log(allFiles)
                const queue = new Queue(async (file, endTask) => {
                    if (photoFileTypes.includes(path.extname(file))) {
                        await this.compressImages(tempPath + '/' + file);
                    }
                    if (videoFileTypes.includes(path.extname(file))) {
                        await this.videoQueue.push(tempPath + '/' + file);
                    }
                    if (webFileTypes.includes(path.extname(file))) {
                        await this.compressWeb(tempPath + '/' + file);
                    }
                    if (zipFileTypes.includes(path.extname(file))) {
                        await this.compressZipFileSystem(tempPath + '/' + file);
                    }
                    endTask();
                }, { batchSize: 1, concurrent: 1 });
                queue.push(allFiles);
            })
            
            
           
                        
                   
               
            //cleanupCallback();
        });
    }

    async compressZipExperimental(file) {
        fs.readFile(file, async (err, data) => {
            if (err) throw err;
            const zip = await JSZip.loadAsync(data);
            const allFiles = Object.keys(zip.files).filter((file) => {
                if (photoFileTypes.includes(path.extname(file))) {
                    return file;
                }
                if (videoFileTypes.includes(path.extname(file))) {
                    return file;
                }
                if (webFileTypes.includes(path.extname(file))) {
                    return file;
                }
            });
            console.log('Number of Files:', allFiles.length);
            console.log(allFiles);

            zip.generateInternalStream({
                type: 'nodebuffer',
                streamFiles: true,
            })
                .on('data', async (data, metadata) => {
                    // data is a Uint8Array because that's the type asked in generateInternalStream
                    // metadata contains for example currentFile and percent, see the generateInternalStream doc.
                    // if (photoFileTypes.includes(path.extname(metadata.currentFile))) {
                    //     processedContent = await this.compressImageBuffer(data);
                    // }
                    console.log(metadata.currentFile);
                })
                .on('error', (e) => {
                    // e is the error
                })
                .on('end', () => {
                    // no parameter
                })
                .resume();

            // for (const file of allFiles) {
            //     const content = await zip.file(file).async("nodebuffer", metadata => console.log("progression: " + metadata.percent.toFixed(2) + " %"));
            //     let processedContent = null;
            //     if (photoFileTypes.includes(path.extname(file))) {
            //         processedContent = await this.compressImageBuffer(content);
            //     }

            //     if (videoFileTypes.includes(path.extname(file))) {
            //         //Still need to process video content in handbrake
            //         // const tmpobj = tmp.dirSync();
            //         // const tmpName = tmp.tmpNameSync();
            //         // console.log(tmpName);
            //         // await fs.writeFile(tmpobj.name + tmpName, content, (err) => {console.error(err)});

            //         //await this.compressVideoBuffer.push(file, tmpobj.name, tmpName);
            //         //processedContent = fs.readFileSync(tmpobj.name + path.basename(file))
            //         processedContent = content;
            //     }

            //     if (webFileTypes.includes(path.extname(file))) {
            //         processedContent = await this.compressWebBuffer(content, file);
            //     }

            //     console.log("File:", allFiles.indexOf(file), "of", allFiles.length);
            //     zip.file(file, processedContent, {binary: true})
            // }

            // zip
            // .generateNodeStream({streamFiles: true, compression: "DEFLATE"})
            // .pipe(fs.createWriteStream(OUTPUT_path + path.basename(file)))
            // .on('finish', function () {
            //     console.log(path.basename(file), "written.");
            // });
        });
    }
}
