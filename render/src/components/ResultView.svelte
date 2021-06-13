<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import ResultItem from './ResultItem.svelte'
  import ResultItemPreview from './ResultItemPreview.svelte'
  import type { PublicPlugin } from '../../../shared/types/plugin';


  export let results = new Map();
  export let onResultEnter;

  let selectedIndex = 0;
  let list = []
  let preview = ''

  $: if (results) {
    // list变化时，selectedIndex归0
    selectedIndex = 0
    list = Array.from(results.values()).flat();
  }
  afterUpdate(() => {
    if (window.innerHeight < 80) {
      return;
    }
    // @ts-ignore
    document.querySelector('.result-item.selected')?.scrollIntoViewIfNeeded(false)
  })

  $: {
    let targetPlugin: PublicPlugin = null
    let targetIndex: number = -1
    const item = list[selectedIndex]
    for (const [plugin, list] of results) {
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
        results.get(targetPlugin)
      )).then(res => {
        console.log(res)
        preview = res
      })
    }
  }

  const keydownHandler = (e: KeyboardEvent) => {
    const listLength = list.length || 1
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
    document.addEventListener('keydown', keydownHandler)
  })
</script>

<div class="result-view">
  <div class="result-list-container" style="flex: 1">
    {#each list as item, index (item)}
      <ResultItem
      {...item}
      selected={index === selectedIndex}
      onEnter={() => onResultEnter(item)}></ResultItem>
    {/each}
  </div>
  {#if preview}
    <ResultItemPreview>{@html preview}</ResultItemPreview>
  {/if}
</div>

<style>

.result-view {
  display: flex;
}
.result-list-container {
  flex: 3;
  max-height: 540px;
  overflow: auto;
}
</style>