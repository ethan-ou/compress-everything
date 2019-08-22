import React from 'react';
import Dropzone from 'react-dropzone'
import { ipcRenderer } from 'electron';
import { acceptedTypesArray } from '../constants/types';

export default class DragAndDrop extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            files: [],
        }   
    }
    onDrop = (acceptedFiles) => {
        if (acceptedFiles.length < 1) return;
        this.setState({files: acceptedFiles})
        const filePaths = acceptedFiles.map( file => file.path );
        ipcRenderer.send('files:submit', filePaths);
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