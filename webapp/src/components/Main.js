import React, { Component } from 'react';
import { Route , BrowserRouter, Link, Switch } from 'react-router-dom';
import Home from "./Home.js";
import Game from "./Game.js";

class Main extends Component {

  render() {
    return (
        <div className="App">
          
          
 <div>
 <nav>
   <ul>
     <li>
       <Link to="/">Home</Link>
     </li>
     <li>
       <Link to="/game">Game</Link>
     </li>
   
   </ul>
 </nav>

 {/* A <Switch> looks through its children <Route>s and
     renders the first one that matches the current URL. */}
 <Switch> {/* The Switch decides which component to show based on the current URL.*/}
<Route exact path='/' component={Home}></Route>
<Route exact path='/game' component={Game}></Route>
</Switch>
</div>
        </div>
      
    );
  }
}
export default Main;



