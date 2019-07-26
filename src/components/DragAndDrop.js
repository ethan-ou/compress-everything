import React from 'react';
import Dropzone from 'react-dropzone'
const fs = window.require('fs');
const path = window.require('path');
const Queue = window.require('better-queue');
const JSZip = window.require("jszip");
const hbjs = window.require('handbrake-js');
const compress_images = window.require('compress-images');

const videoFileTypes = ['.mp4', '.MP4', '.mkv', '.MKV', '.mov', '.MOV'];
const photoFileTypes = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.svg', '.SVG', '.gif', '.GIF'];
const OUTPUT_path = './output/';


//What to do next:
//Go and look at Crimp. It is an app similar to yours.
//What it does is it sends messages to the ipcRenderer to do the heavy processing.
//That way you can free the view to actually be a view.
//Refactor this code to work outside of this react component.
export default class DragAndDrop extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            files: [],
        }
        this.videoQueue = new Queue(function (file, endTask) {
            console.log("From videoQueue:", file.path);
            hbjs.spawn({ 
                input: file.path, 
                output: OUTPUT_path + file.name, 
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
            console.log("From photoQueue:", file.path);
            compress_images(file.path, OUTPUT_path + file.name, {compress_force: false, statistic: true, autoupdate: true}, false,
                {jpg: {engine: 'mozjpeg', command: ['-quality', '80']}},
                {png: {engine: 'pngquant', command: ['--quality=50-70']}},
                {svg: {engine: 'svgo', command: '--multipass'}},
                {gif: {engine: 'gifsicle', command: ['--colors', '256', '--use-col=web']}}, function(err, completed){
                    if(completed === true) {
                        endTask();
                    }
                    if(err) {
                        console.log(err);
                    }
                    console.log('-------------');
                    console.log(error);
                    console.log(completed);
                    console.log(statistic);
                    console.log('-------------');
                    });

        });
        
    }

    addToQueue = (files) => {
        files.forEach(file => {
            if (videoFileTypes.includes(path.extname(file.name))) {
                this.videoQueue.push(file);   
            }
            if (photoFileTypes.includes(path.extname(file.name))) {
                this.photoQueue.push(file);   
            }
        })
    }

    onDrop = (acceptedFiles) => {
        this.setState({files: acceptedFiles})
        this.addToQueue(this.state.files);
    }

    

    render() {
        const previewStyle = {
            display: 'inline',
            width: 100,
            height: 100,
          };
        
        return(
            <div>
                <Dropzone onDrop={this.onDrop} accept={['image/png', 'image/jpg', 'image/svg+xml', 'image/gif', 'video/mp4']} multiple >
                {({getRootProps, getInputProps}) => (
                    <section>
                    <div {...getRootProps({className: 'dropzone'})}>
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                    </section>
                    )}
                </Dropzone>
                {this.state.files.length > 0 &&
                    <div>
                        <h3>Previews</h3>
                        {this.state.files.map(file => (
                            <li key={file.path}>
                            {file.path} - {file.size} bytes
                            </li>
                        ))}
                    </div>
                }
                <p>
                    
                </p>
            </div>
            
        )
    }

}