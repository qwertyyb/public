import type { Component } from 'solid-js';
import { HashRouter, Route } from "@solidjs/router";
import MainView from './views/MainView';

import styles from './App.module.css';
import SubListView from './views/SubListView';

const App: Component = () => {
  return (
    <div class={styles.App}>
      <HashRouter>
        <Route path="/plugin/list-view" component={SubListView} />
        <Route path="/" component={MainView} />
      </HashRouter>
    </div>
  );
};

export default App;
