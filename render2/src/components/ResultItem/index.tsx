import { Component, Show } from 'solid-js'
import styles from './index.module.css'

interface Props { icon: string, title: string, subtitle: string, selected: boolean, onEnter: (event: Event) => void }

const ResultItem: Component<Props> = (props) => {
  return (
    <div class={styles.resultItem}
      classList={{ [styles.selected]: props.selected }}
      onClick={props.onEnter}>
      <div class={styles.itemImageWrapper + ' flex-h-v'}>
        <img src={props.icon} alt=""/>
      </div>
      <div class={styles.itemInfo + ' flex-1 flex-col-center'}>
        <h3 class={styles.itemTitle + ' text-single-line'}>{props.title}</h3>
        <Show when={props.subtitle}>
          <h5 class={styles.itemSubtitle +' color-666 text-sm text-single-line'}>{props.subtitle}</h5>
        </Show>
      </div>
    </div>
  )
}

export default ResultItem