<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import type { CommonListItem, PublicPlugin } from '../../../shared/types/plugin';

  import InputBar from './InputBar.svelte'
  import ResultItem from './ResultItem.svelte'
  import ResultItemPreview from './ResultItemPreview.svelte'

  const clearAndFocusInput = () => {
    const el = document.querySelector('.input-bar input')
    el && (el.value = '')
    // @ts-ignore
    el && el.focus()
    preview = ''
    onInputChange('');
    setTimeout(() => {
      // @ts-ignore
      console.log('focus', el.focus())
    }, 200)
  }
  // @ts-ignore
  window.clearAndFocusInput = clearAndFocusInput

  let pluginResultMap = new Map<PublicPlugin, CommonListItem[]>();

  let resultList = []

  let selectedIndex = 0

  let preview = ''

  $: {
    let targetPlugin: PublicPlugin = null
    let targetIndex: number = -1
    const item = resultList[selectedIndex]
    for (const [plugin, list] of pluginResultMap) {
      const index = list.indexOf(item)
      if (index !== -1) {
        // 找到了
        targetIndex = index
        targetPlugin = plugin
        break;
      }
    }
    if (!targetPlugin) {
      preview = ''
    } else {
      // @ts-ignore
      Promise.resolve(targetPlugin.getResultPreview?.(
        item,
        targetIndex,
        pluginResultMap.get(targetPlugin)
      )).then(res => {
        console.log(res)
        preview = res
      })
    }
  }

  const onInputChange = (value: string) => {
    // @ts-ignore
    window.PluginManager.handleQuery(value)
    selectedIndex = 0
  }

  // @ts-ignore
  window.setQuery = (value: string) => {
    const el = document.querySelector('.input-bar input')
    el && (el.value = value)
    // @ts-ignore
    el && (el.focus())
    onInputChange(value)
  }

  const setPluginResults = (e: CustomEvent) => {
    const { plugin, list } = e.detail || {}
    pluginResultMap.set(plugin, list);
    resultList = Array.from(pluginResultMap.values()).flat();
  }

  const onResultEnter = (item: CommonListItem, totalIndex: number) => {
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

  const keydownHandler = (e: KeyboardEvent) => {
    const listLength = resultList.length || 1
    if (e.key === 'ArrowUp') {
      selectedIndex = (selectedIndex - 1 + listLength) % listLength
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'ArrowDown') {
      selectedIndex = (selectedIndex + 1) % listLength
      e.stopPropagation()
      e.preventDefault()
    } else if(e.key === 'Enter') {
      // @ts-ignore
      document.querySelector('.result-item.selected')?.click?.();
      e.stopPropagation()
    }
  }

  onMount(() => {
    document.addEventListener('plugin:setList', setPluginResults)
    document.addEventListener('keydown', keydownHandler)
  })

  afterUpdate(() => {
    setTimeout(() => {
      // @ts-ignore
      document.querySelector('.result-item.selected')?.scrollIntoViewIfNeeded(false)
    }, 60)
  })

  onDestroy(() => {
    document.removeEventListener('plugin:setList', setPluginResults)
    document.removeEventListener('keydown', keydownHandler)
  })
</script>

<main>
  <InputBar on:input={e => onInputChange(e.target.value)}/>
  <div class="result-section">
    <div class="result-list">
      {#each resultList as result, i (result)}
        <ResultItem {...result}
          onEnter={() => onResultEnter(result, i)}
          selected={i === selectedIndex} /> 
      {/each}
    </div>
    {#if preview}
      <ResultItemPreview>{@html preview}</ResultItemPreview>
    {/if}
  </div>
</main>

<style>
  main {
    backdrop-filter: blur(20px);
  }
  .result-section {
    display: flex;
  }
  .result-list {
    flex: 3;
    max-height: 540px;
    overflow: auto;
    scroll-snap-type: y mandatory;
  }
</style>