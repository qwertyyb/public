import React from 'react';
import {
  HashRouter as Router,
  Route
} from 'react-router-dom';
import './App.scss';
import MainView from './components/ResultList';
import SettingsView from './components/SettingsView';

class App extends React.Component {

  render () {
    return (
      <div className="App">
        <Router>
          <Route path="/" exact>
            <MainView></MainView>
          </Route>
          <Route path="/settings" exact>
            <SettingsView></SettingsView>
          </Route>
        </Router>
      </div>
    );
  }
}

export default App;
