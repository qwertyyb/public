import { Component, Show, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import ResultView from "../../components/ResultView";
import { ListItem } from "../../../../shared/types/plugin";
import styles from './index.module.css'
import LoadingBar from "../../components/LoadingBar";

declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.hide': CustomEvent<{}>;
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:setList': CustomEvent<{ name: string, list: ListItem[] }>;
    'inputBar.setValue': CustomEvent<{ value: string }>;
  }
  interface Window {
    plugin?: {
      search: (keyword: string, setList: (list: ListItem[]) => void) => void,
      select: (item: ListItem, itemIndex: number) => Promise<string>,
      enter: (item: ListItem, itemIndex: number) => void
    }
  }
}

const MainView: Component = () => {
  const [results, setResults] = createSignal<ListItem[]>([])
  const [loading, setLoading] = createSignal(false)
  const [keyword, setKeyword] = createSignal('')

  createEffect(on(keyword, (value) => {
    setLoading(true)
    try {
      console.log('startLoading', window.plugin)
      window.plugin?.search(value, (list) => {
        if (value !== keyword()) return
        setResults(list)
        setLoading(false)
      })
    } catch (err) {
      setLoading(false)
    }
  }))

  const onResultEnter = (item: ListItem, itemIndex: number) => {
    window.plugin?.enter(item as ListItem, itemIndex)
  }

  const onResultSelected = (item: ListItem, itemIndex: number) => {
    return window.plugin?.select?.(item as ListItem, itemIndex)
  }

  const setInputValue = (event: CustomEvent<{ value: string }>) => {
    setKeyword(event.detail.value)
  }

  const setPluginResults = (event: CustomEvent<{ name: string, list: ListItem[] }>) => {
    setResults(event.detail.list || [])
  }

  onMount(() => {
    window.addEventListener('plugin:setList', setPluginResults)
    window.addEventListener('inputBar.setValue', setInputValue)
  })

  onCleanup(() => {
    window.removeEventListener('plugin:setList', setPluginResults)
    window.removeEventListener('inputBar.setValue', setInputValue)
  })

  return (
    <div class={styles.subListView}>
      <Show when={loading()}>
        <LoadingBar />
      </Show>
      <ResultView results={results()}
        onResultSelected={onResultSelected}
        onResultEnter={onResultEnter}></ResultView>
    </div>
  )
}

export default MainView
