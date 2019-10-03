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

If you get the error when running the development application: "Sharp failed to self-register", either follow the instructions here: https://electronjs.org/docs/tutorial/using-native-node-modules, or download the (Sharp precompiled binaries for electron v73)[https://github.com/lovell/sharp/releases/tag/v0.23.1] and extract them in your node_modules/sharp/build/Release folder.


Bugs & Fixes:
[] Images currently throw an error when processing MacOS thumbnails. Add extra checks in filetype to avoid this.
[] Convert for loop to promise.all with reduce.
[] Mock up first draft of UI.
[] Add checking if a file is about to be overwritten on save.
