<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import ResultView from './ResultView.svelte'
  import type { CommonListItem, PublicPlugin } from '../../../shared/types/plugin';

  import InputBar from './InputBar.svelte'

  const clearAndFocusInput = () => {
    const el = document.querySelector('.input-bar input')
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

  let pluginResultMap = new Map<PublicPlugin, CommonListItem[]>();

  const onInputChange = (value: string | Event) => {
    const str = typeof value === 'string' ? value : (value.target as HTMLInputElement).value
    // @ts-ignore
    window.PluginManager.handleQuery(str)
  }

  const setKeyword = (event: CustomEvent<{ value: string }>) => {
    const { value } = event.detail;
    const el = document.querySelector<HTMLInputElement>('.input-bar input')
    el && (el.value = value)
    el && (el.focus())
    onInputChange(value)
  }

  const setPluginResults = (e: CustomEvent) => {
    const { plugin, list } = e.detail || {}
    pluginResultMap = pluginResultMap.set(plugin, list)
  }

  const onResultEnter = (item: CommonListItem) => {
    if (!item) return;

    let targetPlugin: PublicPlugin = null
    let targetIndex: number = 0
    for (const [plugin, list] of pluginResultMap) {
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
      list: pluginResultMap.get(targetPlugin)
    })
  }

  onMount(() => {
    document.addEventListener('plugin:setList', setPluginResults)
    window.addEventListener('publicApp.mainWindow.hide', clearAndFocusInput)
    window.addEventListener('inputBar.setValue', setKeyword)
  })

  onDestroy(() => {
    document.removeEventListener('plugin:setList', setPluginResults)
    window.removeEventListener('publicApp.mainWindow.hide', clearAndFocusInput)
    window.removeEventListener('inputBar.setValue', setKeyword)
  })
</script>

<main>
  <InputBar on:input={onInputChange}/>
  <ResultView results={pluginResultMap}
    onResultEnter={onResultEnter}></ResultView>
</main>

<style>
  main {
    backdrop-filter: blur(20px);
    max-width: 780px;
  }
  @media screen and (max-height: 60px) {
    * {
      overflow: hidden;
    }
  }
</style>