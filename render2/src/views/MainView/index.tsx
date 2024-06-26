import { Component, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import InputBar from "../../components/InputBar";
import ResultView from "../../components/ResultView";
import { CommonListItem, ListItem, PluginCommand } from "../../../../shared/types/plugin";
import styles from './index.module.css'

declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.hide': CustomEvent<{}>;
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:showCommands': CustomEvent<{ name: string, commands: CommonListItem[] }>;
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
      const results = window.PluginManager?.handleQuery(value) || []
      // @ts-ignore
      setPluginResultMap({ main: results })
    } else {
      setPluginResultMap({})
    }
  }))

  const focusInput = () => {
    const el = document.querySelector<HTMLInputElement>('#main-input')
    el?.focus()
  }

  const onResultEnter = (name: string, item: ListItem, itemIndex: number) => {
    window.PluginManager?.handleEnter(item as PluginCommand)
  }

  const onResultSelected = (name: string, item: ListItem, itemIndex: number) => {
    return window.PluginManager?.handleSelect(item as PluginCommand, keyword())
  }

  const setInputBarValue = (event: CustomEvent<{ value: string }>) => {
    const { value } = event.detail;
    setKeyword(value)
  }

  const setPluginResults = (e: CustomEvent<{ name: string, commands: CommonListItem[] }>) => {
    const { name, commands } = e.detail || {}
    setPluginResultMap({
      main: commands
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
    console.log('command', command())
    if (!command()) return
    setCommand(null)
    window.PluginManager?.exitPlugin('xxx')
    setKeyword(preKeyword)
    focusInput()
  }

  onMount(() => {
    window.addEventListener('plugin:showCommands', setPluginResults)
    window.addEventListener('publicApp.mainWindow.show', focusInput)
    window.addEventListener('inputBar.setValue', setInputBarValue)
    window.addEventListener('inputBar.enter', enterSubInput)
  })

  onCleanup(() => {
    window.removeEventListener('plugin:showCommands', setPluginResults)
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
