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
  // @ts-ignore
  window.clearAndFocusInput = clearAndFocusInput

  let pluginResultMap = new Map<PublicPlugin, CommonListItem[]>();

  const onInputChange = (value: string | Event) => {
    const str = typeof value === 'string' ? value : (value.target as HTMLInputElement).value
    // @ts-ignore
    window.PluginManager.handleQuery(str)
  }

  // @ts-ignore
  window.setQuery = (value: string) => {
    const el = document.querySelector('.input-bar input')
    // @ts-ignore
    el && (el.value = value)
    // @ts-ignore
    el && (el.focus())
    onInputChange(value)
  }

  const setPluginResults = (e: CustomEvent) => {
    const { plugin, list } = e.detail || {}
    console.timeEnd(plugin.title)
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

    window.ipcRenderer.send('HideWindow')
    clearAndFocusInput()
    window.PluginManager.handleEnter(targetPlugin, {
      item,
      index: targetIndex,
      list: pluginResultMap.get(targetPlugin)
    })
  }

  onMount(() => {
    document.addEventListener('plugin:setList', setPluginResults)
  })

  onDestroy(() => {
    document.removeEventListener('plugin:setList', setPluginResults)
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
  }
  @media screen and (max-height: 60px) {
    * {
      overflow: hidden;
    }
  }
</style>