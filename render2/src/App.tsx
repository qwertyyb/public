import type { Component } from 'solid-js';
import MainView from './views/MainView';

import styles from './App.module.css';

const App: Component = () => {
  return (
    <div class={styles.App}>
      <MainView></MainView>
    </div>
  );
};

export default App;
