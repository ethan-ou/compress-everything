import React from 'react';
import Dropzone from 'react-dropzone'
import { ipcRenderer } from 'electron';

const acceptedFileTypes = [
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'image/gif',
    'video/mp4',
    '.m4v',
    '.mkv',
    '.mov',
    '.mpeg',
    'application/zip',
    'application/epub+zip',
    '.zip',
    '.pptx',
    '.docx',
    '.xlsx',
    'text/html',
    'text/css',
    'text/javascript'
]

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
                <Dropzone onDrop={this.onDrop} accept={acceptedFileTypes} multiple >
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