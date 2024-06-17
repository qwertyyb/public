import { Component, createSignal, onCleanup, onMount } from "solid-js";
import InputBar from "../../components/InputBar";
import ResultView from "../../components/ResultView";
import { CommonListItem, PublicPlugin } from "../../../../shared/types/plugin";

const MainView: Component = () => {
  const [pluginResultMap, setPluginResultMap] = createSignal(new Map<PublicPlugin, CommonListItem[]>())

  const onInputChange = (value: string | Event) => {
    const str = typeof value === 'string' ? value : (value.target as HTMLInputElement).value
    window.PluginManager.handleQuery(str)
  }

  const clearAndFocusInput = () => {
    const el = document.querySelector('input')
    // @ts-ignore
    el && (el.value = '')
    // @ts-ignore
    el && el.focus()
    onInputChange('');
    setTimeout(() => {
      // @ts-ignore
      console.log('focus', el.focus())
    }, 200)
  }

  const onResultEnter = (item: CommonListItem) => {
    if (!item) return;

    let targetPlugin: PublicPlugin | null = null
    let targetIndex: number = 0
    for (const [plugin, list] of pluginResultMap()) {
      const index = list.indexOf(item)
      if (index !== -1) {
        // 找到了
        targetIndex = index
        targetPlugin = plugin
        break;
      }
    }

    clearAndFocusInput()

    window.PluginManager.handleEnter(targetPlugin, {
      item,
      index: targetIndex,
      list: pluginResultMap().get(targetPlugin!)!
    })
  }

  const setKeyword = (event: CustomEvent<{ value: string }>) => {
    const { value } = event.detail;
    const el = document.querySelector<HTMLInputElement>('input')
    el && (el.value = value)
    el && (el.focus())
    onInputChange(value)
  }

  const setPluginResults = (e: CustomEvent) => {
    const { plugin, list } = e.detail || {}
    console.log(e)
    setPluginResultMap(pluginResultMap().set(plugin, list))
  }

  onMount(() => {
    // @ts-ignore
    document.addEventListener('plugin:setList', setPluginResults)
    window.addEventListener('publicApp.mainWindow.hide', clearAndFocusInput)
    // @ts-ignore
    window.addEventListener('inputBar.setValue', setKeyword)
  })

  onCleanup(() => {
    // @ts-ignore
    document.removeEventListener('plugin:setList', setPluginResults)
    window.removeEventListener('publicApp.mainWindow.hide', clearAndFocusInput)
    // @ts-ignore
    window.removeEventListener('inputBar.setValue', setKeyword)
  })

  return (
    <>
      <InputBar onInput={onInputChange}/>
      <ResultView result={pluginResultMap()}
        onResultEnter={onResultEnter}></ResultView>
    </>
  )
}

export default MainView
