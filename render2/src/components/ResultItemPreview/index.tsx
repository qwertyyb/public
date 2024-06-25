import { Component, onMount } from "solid-js";
import styles from './index.module.css';

const ResultItemPreview: Component<{ html: string | HTMLElement }> = (props) => {
  return (
    <section class={styles.resultItemPreview}>
      <div class={styles.previewWrapper} innerHTML={props.html as string}>
      </div>
    </section>
  )
}

export default ResultItemPreview
