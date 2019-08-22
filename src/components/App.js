import '../assets/css/App.css';
import React from 'react';
import DragAndDrop from './DragAndDrop';


class App extends React.Component {


  render() {
    return (
      <div>
        <h1>Hello, Electron!</h1>
        <p>I hope you enjoy using basic-electron-react-boilerplate to start your dev off right!</p>
        <DragAndDrop />
      </div>
    );
  }
}

export default App;
