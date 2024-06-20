import { Component } from "solid-js";
import styles from './index.module.css'

const LoadingBar: Component = () => {
  return (
    <div class={styles.loadingBar}>
      <div class={styles.loadingBarInner}></div>
    </div>
  )
}

export default LoadingBar
