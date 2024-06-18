import { Component } from "solid-js";
import styles from './index.module.css';

const ResultItemPreview: Component<{ html: string }> = (props) => {
  return (
    <section class={styles.resultItemPreview}>
      <div class={styles.previewWrapper} innerHTML={props.html}>
      </div>
    </section>
  )
}

export default ResultItemPreview
