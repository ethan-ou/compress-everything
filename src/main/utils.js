import mime from 'mime';
import { acceptedTypes } from '../constants/types';

function sortFiles(files) {
    const image = filterFiles(files, "image");
    const video = filterFiles(files, "video");
    const text = filterFiles(files, "text");
    const zip = filterFiles(files, "zip");
    const rejected = filterFiles(files, undefined);
    return {
        image,
        video,
        text,
        zip,
        rejected
    }
}

async function queueFiles(files, options, callback, queueType) {
    await files.map(async file => queueType.add(async () => callback(file, options)));
}

async function queueFile(file, options, callback, queueType) {
    await queueType.add(async () => callback(file, options));
}

function filterFiles(files, fileType) {
    return files.filter(file => acceptedTypes[mime.getType(file)] === fileType);
}

function filterFile(file, fileType) {
    return acceptedTypes[mime.getType(file)] === fileType;
}

export { sortFiles, queueFiles, queueFile, filterFiles, filterFile }