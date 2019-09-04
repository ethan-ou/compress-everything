const path = require('path');

export function setImageSize(options) {
    switch(options.resolution) {
        case '0':
            return [800, 800];
        case '1':
            return [1280, 1280];
        case '2':
            return [1600, 1600];
        case '3':
            return [2048, 2048];
    }
}

export function setOutputType(options, file) {
    switch(options.outputType) {
        case '0':
            return path.format({
                        dir: path.dirname(file),
                        base: path.basename(file, path.extname(file)) + options.outputFilename + path.extname(file)
                    });
        case '1':
            return path.format({
                        dir: options.outputPath,
                        base: path.basename(file)
                    });
    }
}

export const resizeImages = [2048, 2048];
export const OUTPUT_path = './output/';