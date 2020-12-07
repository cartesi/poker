import React, { Component } from 'react';
import { Route , BrowserRouter } from 'react-router-dom';
import Main from "./Main.js";

class App extends Component {

  render() {
    return (
      <BrowserRouter>
        <div className="App">
          <Main />
        </div>
      </BrowserRouter>
      
    );
  }
}
export default App;