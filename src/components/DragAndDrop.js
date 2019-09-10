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
            outputNewFolder: "compressed",
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
                        <div {...getRootProps({className: 'p-10 py-32 border-dashed border-4 border-gray-600 bg-gray-200 hover:bg-white'})}>
                            <input {...getInputProps()} />
                            <p className="text-xl font-bold text-gray-800 text-center">Drag 'n' drop some files, or click to select files</p>
                        </div>
                    </section>
                    )}
                </Dropzone>
                <div className="m-3">
                    <div>
                        <h2 className="text-xl font-bold">Settings</h2>
                        <label>Output Folder:
                            <select 
                                name="outputType" 
                                className="form-select mt-1 mr-2 ml-2"
                                onChange={this.handleInputChange} 
                                value={this.state.outputType}
                            >
                                <option value="0">Rename File</option>
                                <option value="1">New Folder</option>
                                <option value="2">Select a Folder</option>
                            </select>
                        </label>
                        { 
                            this.state.outputType === "0" ? 
                            <label>Suffix:
                                <input 
                                    type="text" 
                                    name="outputFilename" 
                                    className="form-input mx-2"
                                    onChange={this.handleInputChange} 
                                    disabled={this.state.outputType !== "0"} 
                                    value={this.state.outputFilename}  
                                />
                            </label>
                            : this.state.outputType === "1" ?
                            <label>Folder Name:
                                <input 
                                    type="text" 
                                    name="outputNewFolder" 
                                    className="form-input mx-2"
                                    onChange={this.handleInputChange} 
                                    disabled={this.state.outputType !== "1"} 
                                    value={this.state.outputNewFolder}  
                                />     
                            </label>
                            : this.state.outputType === "2" ?
                            <input 
                                type="file" 
                                webkitdirectory="true" 
                                name="outputPath"
                                className="mx-2" 
                                onChange={this.handleInputChange} 
                                disabled={this.state.outputType !== "2"} 
                            />
                            : null
                        }
                    </div>

                    <div className="mt-2">
                        <input 
                            type="checkbox" 
                            className="form-checkbox"
                            id="resizeSwitch" 
                            name="resize" 
                            onChange={this.handleInputChange} 
                            checked={this.state.resize} 
                        />
                        <label htmlFor="resizeSwitch" className="ml-2 mr-2">Resize</label>

                        <select 
                            name="resolution" 
                            className="form-select disabled:opacity-75 disabled:bg-gray-200" 
                            disabled={!this.state.resize} 
                            onChange={this.handleInputChange} 
                            value={this.state.resolution} 
                        >
                            <option value="0">Small (800px)</option>
                            <option value="1">Medium (1280px)</option>
                            <option value="2">Large (1600px)</option>
                            <option value="3">X-Large (2048px)</option>
                        </select>
                    </div>

                    <div className="mt-2">
                        <input 
                            type="checkbox" 
                            id="avoidResizeZip" 
                            name="avoidResizeZip" 
                            className="form-checkbox"
                            onChange={this.handleInputChange} 
                            checked={this.state.avoidResizeZip} 
                        />
                        <label htmlFor="avoidResizeZip" className="ml-2 mr-2">Avoid Resizing images in Web-based Zip Files</label>
                    </div>
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