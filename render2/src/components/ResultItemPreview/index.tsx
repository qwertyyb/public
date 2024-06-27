import { Component, createEffect, onMount } from "solid-js";
import styles from './index.module.css';

const ResultItemPreview: Component<{ html: string | HTMLElement }> = (props) => {
  let previewEl: HTMLDivElement | null = null
  createEffect(() => {
    if (typeof props.html === 'string') {
      previewEl!.innerHTML = props.html
    } else {
      previewEl!.innerHTML = ''
      previewEl!.appendChild(props.html)
    }
  })
  return (
    <section class={styles.resultItemPreview}>
      <div class={styles.previewWrapper} ref={previewEl!}></div>
    </section>
  )
}

export default ResultItemPreview
