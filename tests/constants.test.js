import os from 'os';
import { setImageSize, setOutputType, imageMinPlugins, HTMLMinifySettings, CleanCSSSettings } from '../src/constants/settings';

test('Small Images are 800px', () => {
    expect(setImageSize({resolution: '0'})).toEqual([800, 800]);
});

test('Medium Images are 1280px', () => {
    expect(setImageSize({resolution: '1'})).toEqual([1280, 1280]);
});

test('Save file in same folder, with different name', () => {
    let options = {
        outputType: '0', 
        outputFilename: '-compressed'
    }

    if (os.platform() === "win32") expect(setOutputType(options, "C:\\file.jpg")).toBe("C:\\\\file-compressed.jpg");
    if (os.platform() === "darwin") expect(setOutputType(options, "C:/file.jpg")).toBe("C:/file-compressed.jpg");
});