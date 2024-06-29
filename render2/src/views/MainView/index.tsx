import { Component, Show, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
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
    'inputBar.enter': CustomEvent<{ name: string, query?: string, command: PluginCommand }>,
    'inputBar.disable': CustomEvent<{ disable: boolean }>
  }
}

const MainView: Component = () => {
  const [results, setResults] = createSignal<PluginCommand[]>([])
  const [inputDisable, setInputDisable] = createSignal(false)
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
    if (command()) return
    window.PluginManager?.handleEnter(results()[itemIndex])
  }

  const onResultSelected = (item: PluginCommand, itemIndex: number) => {
    if (command()) return
    return window.PluginManager?.handleSelect(results()[itemIndex], keyword())
  }

  const setInputBarValue = (event: CustomEvent<{ value: string }>) => {
    const { value } = event.detail;
    setKeyword(value)
  }

  const setPluginResults = (e: CustomEvent<{ commands: PluginCommand[] }>) => {
    const { commands } = e.detail || {}
    setResults(commands)
  }

  const setInputBarDisable = (e: CustomEvent<{ disable: boolean }>) => {
    setInputDisable(e.detail.disable)
  }
  
  let preKeyword = ''
  const enterSubInput = (e: CustomEvent<{ name: string, query?: string, command: PluginCommand }>) => {
    preKeyword = keyword()
    setKeyword(e.detail.query ?? '')
    setCommand(e.detail.command)
  }

  const exitCommand = () => {
    if (!command()) return
    setCommand(null)
    window.PluginManager?.exitPlugin('xxx')
    setInputDisable(false)
    setKeyword(preKeyword)
    setTimeout(() => {
      focusInput()
    })
  }

  onMount(() => {
    window.addEventListener('plugin:showCommands', setPluginResults)
    window.addEventListener('publicApp.mainWindow.show', focusInput)
    window.addEventListener('inputBar.setValue', setInputBarValue)
    window.addEventListener('inputBar.enter', enterSubInput)
    window.addEventListener('inputBar.disable', setInputBarDisable)
  })

  onCleanup(() => {
    window.removeEventListener('plugin:showCommands', setPluginResults)
    window.removeEventListener('publicApp.mainWindow.show', focusInput)
    window.removeEventListener('inputBar.setValue', setInputBarValue)
    window.removeEventListener('inputBar.enter', enterSubInput)
    window.removeEventListener('inputBar.disable', setInputBarDisable)
  })

  return (
    <div class={styles.mainView}>
      <InputBar value={keyword()}
        command={command()}
        setValue={setKeyword}
        exit={exitCommand}
        disable={inputDisable()}
      />
      <Show when={!command()}>
        <ResultView results={list()}
          onResultSelected={onResultSelected}
          onResultEnter={onResultEnter}></ResultView>
      </Show>
    </div>
  )
}

export default MainView
