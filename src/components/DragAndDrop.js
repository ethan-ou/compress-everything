import React from 'react';
import Dropzone from 'react-dropzone'
import { ipcRenderer } from 'electron';
import { acceptedTypesArray } from '../constants/types';

export default class DragAndDrop extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            files: [],
            resize: true,
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
                <Dropzone onDrop={this.onDrop} accept={acceptedTypesArray} multiple >
                {({getRootProps, getInputProps}) => (
                    <section>
                    <div {...getRootProps({className: 'dropzone'})}>
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                    <div>
                        <label>Select your directory
                            <input type="file" webkitdirectory="true"/>
                        </label>
                    </div>
                    </section>
                    )}
                </Dropzone>
                <div>
                    <input type="checkbox" id="resizeSwitch" name="resize" onChange={this.handleInputChange} checked={this.state.resize} />
                    <label htmlFor="resizeSwitch">Resize</label>

                    <input type="radio" id="contactChoice1" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "0"} disabled={!this.state.resize} value="0" />
                    <label htmlFor="contactChoice1">Small (800px)</label>

                    <input type="radio" id="contactChoice2" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "1"} disabled={!this.state.resize} value="1" />
                    <label htmlFor="contactChoice2">Medium (1280px)</label>

                    <input type="radio" id="contactChoice3" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "2"} disabled={!this.state.resize} value="2" />
                    <label htmlFor="contactChoice3">Large (1600px)</label>

                    <input type="radio" id="contactChoice4" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "3"} disabled={!this.state.resize} value="3" />
                    <label htmlFor="contactChoice4">Extra-Large (2048px)</label>

                    {/* <input type="radio" id="contactChoice5" name="resolution" onChange={this.handleInputChange} checked={this.state.resolution === "4"} disabled={!this.state.resize} value="4" />
                    <label htmlFor="contactChoice6">Custom</label> */}
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