import { Component, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import InputBar from "../../components/InputBar";
import ResultView from "../../components/ResultView";
import { CommonListItem } from "../../../../shared/types/plugin";
import styles from './index.module.css'

declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.hide': CustomEvent<{}>;
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:setList': CustomEvent<{ name: string, list: CommonListItem[] }>;
    'inputBar.setValue': CustomEvent<{ value: string }>;
    'inputBar.enter': CustomEvent<{ name: string, item: CommonListItem }>
  }
}

const MainView: Component = () => {
  const [pluginResultMap, setPluginResultMap] = createSignal<Record<string, CommonListItem[]>>({})
  const [keyword, setKeyword] = createSignal('')
  const [command, setCommand] = createSignal<CommonListItem | null>(null)

  createEffect(on(keyword, (value) => {
    if (command()) {
      window.PluginManager?.setSubInputValue(value)
      return
    }
    if (value) {
      window.PluginManager?.handleQuery(value)
    } else {
      setPluginResultMap({})
    }
  }))

  const focusInput = () => {
    const el = document.querySelector<HTMLInputElement>('#main-input')
    el?.focus()
  }

  const onResultEnter = (name: string, item: CommonListItem, itemIndex: number) => {
    const targetPlugin = window.PluginManager?.getPlugins()?.get(name)
    if (!targetPlugin) return;

    window.PluginManager?.handleEnter(targetPlugin, {
      item,
      index: itemIndex,
      list: pluginResultMap()[name]
    })
  }

  const onResultSelected = (name: string, item: CommonListItem, itemIndex: number) => {
    const targetPlugin = window.PluginManager?.getPlugins().get(name)
    return targetPlugin?.plugin?.getResultPreview?.(item, itemIndex, pluginResultMap()[name])
  }

  const setInputBarValue = (event: CustomEvent<{ value: string }>) => {
    const { value } = event.detail;
    setKeyword(value)
  }

  const setPluginResults = (e: CustomEvent<{ name: string, list: CommonListItem[] }>) => {
    const { name, list } = e.detail || {}
    console.log(name, list)
    setPluginResultMap({
      ...pluginResultMap(),
      [name]: list
    })
  }
  
  let preKeyword = ''
  const enterSubInput = (e: CustomEvent<{ name: string, item: CommonListItem }>) => {
    preKeyword = keyword()
    setKeyword('')
    const { item } = e.detail || {}
    setCommand(item)
  }

  const exitCommand = () => {
    if (!command()) return
    setCommand(null)
    window.PluginManager?.exitPlugin('xxx')
    setKeyword(preKeyword)
    focusInput()
  }

  onMount(() => {
    window.addEventListener('plugin:setList', setPluginResults)
    window.addEventListener('publicApp.mainWindow.show', focusInput)
    window.addEventListener('inputBar.setValue', setInputBarValue)
    window.addEventListener('inputBar.enter', enterSubInput)
  })

  onCleanup(() => {
    window.removeEventListener('plugin:setList', setPluginResults)
    window.removeEventListener('publicApp.mainWindow.show', focusInput)
    window.removeEventListener('inputBar.setValue', setInputBarValue)
    window.removeEventListener('inputBar.enter', enterSubInput)

  })

  return (
    <div class={styles.mainView}>
      <InputBar value={keyword()}
        command={command()}
        setValue={setKeyword}
        exit={exitCommand}
      />
      <ResultView result={pluginResultMap()}
        onResultSelected={onResultSelected}
        onResultEnter={onResultEnter}></ResultView>
    </div>
  )
}

export default MainView
