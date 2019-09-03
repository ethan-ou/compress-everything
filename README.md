## Compress Everything
Vision: An app that compresses photos, videos (and hopefully Microsoft documents and zip files) in one easy to use drag-and-drop interface.

Requirements:
* Node 12.9.0+ (Uses Promise.allSettled)

Dependencies:
Make sure you have Node.js and NPM installed. You can do so from [Node's official website](https://nodejs.org/en/). Make sure to download the latest features edition.

How to install:
1. Clone the repository either through ```git clone``` or by downloading the repository as a .zip file.
2. In your command line, navigate into the folder where you cloned the repository by using ```cd```, then run ```npm install --save```.
3. Once all the installs are done, you can run the project by entering ```npm run dev```.

Bugs & Fixes:
[] When resizing images through JIMP with EXIF data, the images are letterboxed.
[] Images currently throw an error when processing MacOS thumbnails.
[] Convert for loop to promise.all with reduce.
[] Convert to promise.allSettled.
[] Mock up first draft of UI.