import { Component, Show } from 'solid-js'
import styles from './index.module.css'

interface Props {
  icon?: string,
  title: string,
  subtitle?: string,
  selected: boolean,
  index: number,
  action?: 'next',
  onEnter: (event: Event) => void,
  onSelect: (event: Event) => void
}

const ResultItem: Component<Props> = (props) => {
  return (
    <div class={styles.resultItem + ' result-item'}
      classList={{ [styles.selected]: props.selected }}
      data-result-item-index={props.index}
      onMouseOver={props.onSelect}
      onClick={props.onEnter}>
      <Show when={props.icon}>
        <div class={styles.itemImageWrapper + ' flex-h-v'}>
          <img src={props.icon} alt=""/>
        </div>
      </Show>
      <div class={styles.itemInfo + ' flex-1 flex-col-center'}>
        <h3 class={styles.itemTitle + ' text-single-line'}>{props.title}</h3>
        <Show when={props.subtitle}>
          <h5 class={styles.itemSubtitle +' color-666 text-sm text-single-line'}>{props.subtitle}</h5>
        </Show>
      </div>
      <Show when={props.action}>
        <div class="action-btn">
          <span class={"material-symbols-outlined " + styles.actionIcon}>arrow_forward_ios</span>
        </div>
      </Show>
    </div>
  )
}

export default ResultItem
