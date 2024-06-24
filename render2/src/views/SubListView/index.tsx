import { Component, Show, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import ResultView from "../../components/ResultView";
import { CommonListItem } from "../../../../shared/types/plugin";
import styles from './index.module.css'
import LoadingBar from "../../components/LoadingBar";

declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.hide': CustomEvent<{}>;
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:setList': CustomEvent<{ name: string, list: CommonListItem[] }>;
    'inputBar.setValue': CustomEvent<{ value: string }>;
    'inputBar.enter': CustomEvent<{ name: string, item: CommonListItem }>
  }
  interface Window {
    plugin?: {
      search: (keyword: string, setList: (list: CommonListItem[]) => void) => void,
      select: (item: CommonListItem, itemIndex: number) => Promise<string>,
      enter: (item: CommonListItem, itemIndex: number) => void
    }
  }
}

const MainView: Component = () => {
  const [pluginResultMap, setPluginResultMap] = createSignal<Record<'main', CommonListItem[]>>({ main: [] })
  const [loading, setLoading] = createSignal(false)
  const [keyword, setKeyword] = createSignal('')

  createEffect(on(keyword, (value) => {
    setLoading(true)
    try {
      window.plugin?.search(value, (list) => {
        if (value !== keyword()) return
        setPluginResultMap({ main: list })
        setLoading(false)
      })
    } catch (err) {
      setLoading(false)
    }
  }))

  const onResultEnter = (name: string, item: CommonListItem, itemIndex: number) => {
    window.plugin?.enter(item, itemIndex)
  }

  const onResultSelected = (name: string, item: CommonListItem, itemIndex: number) => {
    return window.plugin?.select?.(item, itemIndex)
  }

  const setInputValue = (event: CustomEvent<{ value: string }>) => {
    setKeyword(event.detail.value)
  }

  const setPluginResults = (event: CustomEvent<{ name: string, list: CommonListItem[] }>) => {
    setPluginResultMap({
      main: event.detail.list || []
    })
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
      <ResultView result={pluginResultMap()}
        onResultSelected={onResultSelected}
        onResultEnter={onResultEnter}></ResultView>
    </div>
  )
}

export default MainView
