import { Show, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import styles from './index.module.css';
import ResultItem from "../ResultItem";
import { ListItem } from "../../../../shared/types/plugin";
import ResultItemPreview from "../ResultItemPreview";
import VirtualList from "../VirtualList";

interface Props<D> {
  results: D[],
  onResultEnter: (item: D, itemIndex: number) => void,
  onResultSelected: (item: D, itemIndex: number) => string | HTMLElement | Promise<string> | Promise<HTMLElement> | undefined,
}

function ResultView<D extends ListItem>(props: Props<D>) {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const selectedItem = () => props.results[selectedIndex()]
  const [preview, setPreview] = createSignal<string | HTMLElement>('')
  const [actionKeyIndexStart, setActionKeyIndexStart] = createSignal(0)

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
    } else if (e.metaKey && /^\d$/.test(e.key)) {
      const key = parseInt(e.key, 10)
      setSelectedIndex(actionKeyIndexStart() + key - 1)
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
  createEffect(on(() => props.results[selectedIndex()], () => {
    (document.querySelector<HTMLElement>(`.result-item[data-result-item-index="${selectedIndex()}"]`) as any)?.scrollIntoViewIfNeeded(false)
    const parentRect = document.querySelector('div.virtual-list')!.getBoundingClientRect()
    const els = document.querySelectorAll<HTMLElement>('.result-item[data-result-item-index]')
    let visibleIndexList: number[] = []
    els.forEach(item => {
      const rect = item.getBoundingClientRect()
      const visible = rect.top + rect.height / 2 >= parentRect.top && rect.top + rect.height / 2 <= parentRect.bottom
      if (visible) {
        visibleIndexList.push(parseInt(item.dataset.resultItemIndex as string, 10))
      }
    })
    setActionKeyIndexStart(visibleIndexList[0])
    console.log(visibleIndexList)
  }))

  createEffect(on(selectedItem, getPreview))

  onMount(() => {
    document.addEventListener('keydown', keydownHandler)
  })
  onCleanup(() => {
    document.removeEventListener('keydown', keydownHandler)
  })

  const getActionKey = (index: number, indexStart: number) => {
    const key = index - indexStart + 1
    if (key > 0) return String(key)
    return ''
  }

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
              actionKey={getActionKey(itemProps.index, actionKeyIndexStart())}
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
