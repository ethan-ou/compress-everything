import React from 'react';
import Dropzone from 'react-dropzone'
import { ipcRenderer } from 'electron';



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
                <Dropzone onDrop={this.onDrop} accept={['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'video/mp4', '.pptx']} multiple >
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