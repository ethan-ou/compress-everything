import React from 'react';
import Dropzone from 'react-dropzone'

export default class DragAndDrop extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            files: [],
        }
        
    }

    process = (acceptedFiles) => {
        this.setState({files: acceptedFiles})
        console.log(acceptedFiles);
        console.log(this.state.files)
    }

    render() {
        return(
            <div>
                <Dropzone onDrop={this.process} accepts={['image/png', 'image/jpg', 'image/svg', 'image/gif', 'video/mp4']} multiple >
                {({getRootProps, getInputProps}) => (
                    <section>
                    <div {...getRootProps({className: 'dropzone'})}>
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                    </section>
                    )}
                </Dropzone>
                <p>
                    {this.state.files.map(file => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
))}
                </p>
            </div>
            
        )
    }

}