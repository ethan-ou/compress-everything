import { setImageSize, setOutputType, imageMinPlugins, HTMLMinifySettings, CleanCSSSettings } from '../src/constants/settings';

test('Small Images are 800px', () => {
    expect(setImageSize({resolution: '0'})).toEqual([800, 800]);
});

test('Medium Images are 1280px', () => {
    expect(setImageSize({resolution: '1'})).toEqual([1280, 1280]);
});