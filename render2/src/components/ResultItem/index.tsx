import { Component, Show } from 'solid-js'
import styles from './index.module.css'

interface Props {
  icon?: string,
  title: string,
  subtitle?: string,
  selected: boolean,
  index: number,
  action?: 'next',
  actionKey?: string,
  onEnter: (event: Event) => void,
  onSelect: (event: Event) => void
}

const ResultItem: Component<Props> = (props) => {
  return (
    <div class={styles.resultItem + ' result-item'}
      classList={{ [styles.selected]: props.selected }}
      data-result-item-index={props.index}
      onClick={props.onSelect}
      onDblClick={props.onEnter}>
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
      <Show when={props.action || true}>
        <div class={styles.shortcutList}>
          {/* <span class={"material-symbols-outlined " + styles.actionIcon}>arrow_forward_ios</span> */}
          <Show when={props.selected}>
            <div class={styles.shortcutItem}>↵</div>
          </Show>
          <Show when={!props.selected && props.actionKey}>
            <div class={styles.shortcutItem}>⌘</div>
            <div class={styles.shortcutItem}>{props.actionKey}</div>
          </Show>
        </div>
      </Show>
    </div>
  )
}

export default ResultItem
