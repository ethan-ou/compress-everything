import React from 'react';
import Dropzone from 'react-dropzone'
import { ipcRenderer } from 'electron';
import { acceptedTypesArray } from '../constants/types';
import { getDroppedOrSelectedFiles } from 'html5-file-selector';

export default class DragAndDrop extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            files: [],
            outputType: "0",
            outputPath: "./output",
            outputFilename: "-compressed",
            resize: true,
            avoidResizeZip: true,
            resolution: "1"
        }   
    }
    onDrop = (acceptedFiles) => {
        if (acceptedFiles.length < 1) return;
        this.setState({ files: acceptedFiles }, () => {
            const filePaths = acceptedFiles.map(file => file.path);
            const { files, ...options } = this.state;
            ipcRenderer.send('files:submit', { files: filePaths, options }) 
            console.log(JSON.stringify({ filePaths, options }))
        });

        //  ipcRenderer.send('files:submit', JSON.stringify(this.state)) 
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
    
        this.setState({
          [name]: value
        });
    
        console.log(this.state);
    }

    render() {
        const previewStyle = {
            display: 'inline',
            width: 100,
            height: 100,
          };
        
        return(
            <div>
                <Dropzone
                    onDrop={this.onDrop} 
                    accept={acceptedTypesArray} 
                    getDataTransferItems={evt =>
                    getDroppedOrSelectedFiles(evt).then(list =>
                            list.map(({ fileObject, ...rest }) => fileObject)
                        )
                    } 
                    multiple 
                >
                {({getRootProps, getInputProps}) => (
                    <section>
                        <div {...getRootProps({className: 'p-10 py-16 border-dashed border-4 border-gray-600 bg-gray-200 hover:bg-white'})}>
                            <input {...getInputProps()} />
                            <p className="text-xl font-bold text-gray-800 text-center">Drag 'n' drop some files, or click to select files</p>
                        </div>
                    </section>
                    )}
                </Dropzone>
                <div>
                    <h2>Output Folder:</h2>
                    <input type="radio" id="output1" name="outputType" onChange={this.handleInputChange} checked={this.state.outputType === "0"} value="0" />
                    <label htmlFor="output1">Same Directory, Rename to Filename
                        <input type="text" name="outputFilename" onChange={this.handleInputChange} disabled={this.state.outputType !== "0"} value={this.state.outputFilename}  />
                    </label>
                    <input type="radio" id="output2" name="outputType" onChange={this.handleInputChange} checked={this.state.outputType === "1"} value="1" />
                    <label htmlFor="output2">Select directory
                        <input type="file" webkitdirectory="true" name="outputPath" onChange={this.handleInputChange} disabled={this.state.outputType !== "1"} />
                    </label>
                </div>

                <div>
                    <input type="checkbox" id="resizeSwitch" name="resize" onChange={this.handleInputChange} checked={this.state.resize} />
                    <label htmlFor="resizeSwitch">Resize</label>

                    <input type="radio" id="resize1" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "0"} disabled={!this.state.resize} value="0" />
                    <label htmlFor="resize1">Small (800px)</label>

                    <input type="radio" id="resize2" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "1"} disabled={!this.state.resize} value="1" />
                    <label htmlFor="resize2">Medium (1280px)</label>

                    <input type="radio" id="resize3" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "2"} disabled={!this.state.resize} value="2" />
                    <label htmlFor="resize3">Large (1600px)</label>

                    <input type="radio" id="resize4" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "3"} disabled={!this.state.resize} value="3" />
                    <label htmlFor="resize4">Extra-Large (2048px)</label>

                    {/* <input type="radio" id="resize5" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "4"} disabled={!this.state.resize} value="4" />
                    <label htmlFor="resize6">Custom</label> */}
                </div>

                <div>
                    <input type="checkbox" id="avoidResizeZip" name="avoidResizeZip" onChange={this.handleInputChange} checked={this.state.avoidResizeZip} />
                    <label htmlFor="avoidResizeZip">Avoid Resizing images in Web-based Zip Files</label>
                </div>

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
            </div>
            
        )
    }

}