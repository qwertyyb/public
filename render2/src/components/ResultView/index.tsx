import { Component, For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import styles from './index.module.css';
import ResultItem from "../ResultItem";
import { CommonListItem, PublicPlugin } from "../../../../shared/types/plugin";
import ResultItemPreview from "../ResultItemPreview";

interface Props {
  result: Map<PublicPlugin, CommonListItem[]>,
  onResultEnter: (item: CommonListItem) => void,
}

const ResultView: Component<Props> = (props) => {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const list = () => Array.from(props.result.values()).flat()
  const [preview, setPreview] = createSignal('');

  createEffect(() => {
    let targetPlugin: PublicPlugin | null = null
    let targetIndex: number = -1
    const item = list()[selectedIndex()]
    for (const [plugin, list] of props.result) {
      const index = list.indexOf(item)
      if (index !== -1) {
        // 找到了
        targetIndex = index
        targetPlugin = plugin
        break;
      }
    }
    if (!targetPlugin) {
      setPreview('')
    } else {
      // @ts-ignore
      Promise.resolve(targetPlugin.getResultPreview?.(
        item,
        targetIndex,
        props.result.get(targetPlugin)!
      )).then(res => {
        setPreview(res || '');
      })
    }
  })

  const keydownHandler = (e: KeyboardEvent) => {
    const listLength = list.length || 1
    if (e.key === 'ArrowUp') {
      setSelectedIndex(Math.max(0, selectedIndex() - 1))
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'ArrowDown') {
      setSelectedIndex((selectedIndex() + 1) % listLength)
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'Enter') {
      props.onResultEnter(list()[selectedIndex()])
      e.stopPropagation()
    }
  }

  onMount(() => {
    document.addEventListener('keydown', keydownHandler)
  })
  onCleanup(() => {
    document.removeEventListener('keydown', keydownHandler)
  })

  return (
    <div class={styles.resultView}>
      <div class={styles.resultListContainer}>
        <For each={list()}>
          {(item, i) => (
            <ResultItem icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              selected={i() === selectedIndex()}
              onEnter={() => props.onResultEnter(item)}
            />
          )}
        </For>
      </div>
      <Show when={preview()}>
          <ResultItemPreview>{preview()}</ResultItemPreview>
      </Show>
    </div>
  )
}

export default ResultView
