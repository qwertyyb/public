import { Component, JSX, children } from "solid-js";
import styles from './index.module.css';

const ResultItemPreview: Component<{ children: JSX.Element }> = (props) => {
  const createChildren = children(() => props.children)
  return (
    <section class={styles.ResultItemPreview}>
      <div class={styles.previewWrapper}>
        {createChildren()}
      </div>
    </section>
  )
}

export default ResultItemPreview
