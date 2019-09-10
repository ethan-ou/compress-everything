import '../assets/css/App.css';
import React from 'react';
import DragAndDrop from './DragAndDrop';


class App extends React.Component {


  render() {
    return (
      <div className="font-sans">
        <DragAndDrop />
      </div>
    );
  }
}

export default App;
