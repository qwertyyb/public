import { Component, Show, createEffect, createResource, createSignal, on, onCleanup, onMount } from "solid-js";
import { VirtualList } from "cui-virtual-list";
import styles from './index.module.css';
import ResultItem from "../ResultItem";
import { CommonListItem } from "../../../../shared/types/plugin";
import ResultItemPreview from "../ResultItemPreview";
import { getTargetInfo } from '../../utils'

interface Props {
  result: Record<string, CommonListItem[]>,
  onResultEnter: (name: string, item: CommonListItem, itemIndex: number) => void,
  onResultSelected: (name: string, item: CommonListItem, itemIndex: number) => Promise<string> | undefined,
}

const ResultView: Component<Props> = (props) => {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const list = () => Object.values(props.result).flat();
  const selectedItem = () => list()[selectedIndex()]
  const [preview, setPreview] = createSignal('')

  const onResultEnter = (index: number) => {
    const item = list()[index]
    const { targetKey, targetIndex } = getTargetInfo(props.result, item)
    if (!targetKey) return
    props.onResultEnter(targetKey, item, targetIndex)
  }

  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      setSelectedIndex(Math.max(0, selectedIndex() - 1))
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'ArrowDown') {
      setSelectedIndex(Math.min(selectedIndex() + 1, list().length - 1))
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'Enter') {
      onResultEnter(selectedIndex())
      e.stopPropagation()
    }
  }

  const getPreview = async (item: CommonListItem) => {
    if (!item) return setPreview('')
    const { targetKey, targetIndex } = getTargetInfo(props.result, item)
    if (!targetKey) {
      return setPreview('')
    }
    const result = await props.onResultSelected(
      targetKey,
      item,
      targetIndex,
    )
    setPreview(result || '')
  }

  // 结果变化时，把 selectedIndex 置 0
  createEffect(on(list, (v) => { setSelectedIndex(0) }))

  // selectedIndex 变化时，滚动到选择位置，调用preview
  createEffect(on(selectedIndex, (value) => {
    (document.querySelector<HTMLElement>(`.result-item[data-result-item-index="${value}"]`) as any)?.scrollIntoViewIfNeeded(false)
  }))

  createEffect(on(selectedItem, getPreview))

  onMount(() => {
    document.addEventListener('keydown', keydownHandler)
  })
  onCleanup(() => {
    document.removeEventListener('keydown', keydownHandler)
  })

  return (
    <div class={styles.resultView}>
      <div class={styles.resultListContainer}>
        <VirtualList
          maxHeight={54 * 9}
          items={list()}
          itemEstimatedSize={54}
        >
          {(itemProps: any) => (
            <ResultItem icon={itemProps.item.icon}
              title={itemProps.item.title}
              subtitle={itemProps.item.subtitle}
              selected={itemProps.index === selectedIndex()}
              onEnter={() => onResultEnter(itemProps.index)}
              onSelect={() => setSelectedIndex(itemProps.index)}
              index={itemProps.index}
            />
          )}
        </VirtualList>
      </div>
      <Show when={preview()}>
          <ResultItemPreview html={preview()}></ResultItemPreview>
      </Show>
    </div>
  )
}

export default ResultView
