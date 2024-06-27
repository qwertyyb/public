import { Show, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import styles from './index.module.css';
import ResultItem from "../ResultItem";
import { ListItem } from "../../../../shared/types/plugin";
import ResultItemPreview from "../ResultItemPreview";
import VirtualList from "../VirtualList";

console.log(styles)

interface Props<D> {
  results: D[],
  onResultEnter: (item: D, itemIndex: number) => void,
  onResultSelected: (item: D, itemIndex: number) => string | HTMLElement | Promise<string> | Promise<HTMLElement> | undefined,
}

function ResultView<D extends ListItem>(props: Props<D>) {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const selectedItem = () => props.results[selectedIndex()]
  const [preview, setPreview] = createSignal<string | HTMLElement>('')

  const onResultEnter = (index: number) => {
    const item = props.results[index]
    props.onResultEnter(item, index)
  }

  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      setSelectedIndex(Math.max(0, selectedIndex() - 1))
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'ArrowDown') {
      setSelectedIndex(Math.min(selectedIndex() + 1, props.results.length - 1))
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'Enter') {
      onResultEnter(selectedIndex())
      e.stopPropagation()
    }
  }

  const getPreview = async (item: D) => {
    if (!item) return setPreview('')
    const result = await props.onResultSelected(item, selectedIndex())
    setPreview(result || '')
  }

  // 结果变化时，把 selectedIndex 置 0
  createEffect(on(() => props.results, (v) => { setSelectedIndex(0) }))

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
      <div class={styles.resultsListContainer}>
        <VirtualList
          list={props.results}
          keeps={30}
          itemHeight={54}
        >
          {(itemProps) => (
            <ResultItem icon={itemProps.item.icon}
              title={itemProps.item.title}
              subtitle={itemProps.item.subtitle}
              action={itemProps.item.action}
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
