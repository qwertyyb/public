import { Component, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import InputBar from "../../components/InputBar";
import ResultView from "../../components/ResultView";
import { PluginCommand } from "../../../../shared/types/plugin";
import styles from './index.module.css'

declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.hide': CustomEvent<{}>;
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:showCommands': CustomEvent<{ name: string, commands: PluginCommand[] }>;
    'inputBar.setValue': CustomEvent<{ value: string }>;
    'inputBar.enter': CustomEvent<{ name: string, item: PluginCommand }>
  }
}

const MainView: Component = () => {
  const [results, setResults] = createSignal<PluginCommand[]>([])
  const [keyword, setKeyword] = createSignal('')
  const [command, setCommand] = createSignal<PluginCommand | null>(null)
  const list = () => results().map(item => ({ ...item, action: item.mode && ['listView', 'view'].includes(item.mode) ? 'next' : false }))

  createEffect(on(keyword, (value) => {
    if (command()) {
      window.PluginManager?.setSubInputValue(value)
      return
    }
    if (value) {
      const results = window.PluginManager?.handleQuery(value) || []
      setResults(results)
    } else {
      setResults([])
    }
  }))

  const focusInput = () => {
    const el = document.querySelector<HTMLInputElement>('#main-input')
    el?.focus()
  }

  const onResultEnter = (item: PluginCommand, itemIndex: number) => {
    window.PluginManager?.handleEnter(results()[itemIndex])
  }

  const onResultSelected = (item: PluginCommand, itemIndex: number) => {
    return window.PluginManager?.handleSelect(results()[itemIndex], keyword())
  }

  const setInputBarValue = (event: CustomEvent<{ value: string }>) => {
    const { value } = event.detail;
    setKeyword(value)
  }

  const setPluginResults = (e: CustomEvent<{ name: string, commands: PluginCommand[] }>) => {
    const { name, commands } = e.detail || {}
    setResults(commands)
  }
  
  let preKeyword = ''
  const enterSubInput = (e: CustomEvent<{ name: string, item: PluginCommand }>) => {
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
      <ResultView results={list()}
        onResultSelected={onResultSelected}
        onResultEnter={onResultEnter}></ResultView>
    </div>
  )
}

export default MainView
