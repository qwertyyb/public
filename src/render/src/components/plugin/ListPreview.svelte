<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import InputBar from '../InputBar.svelte';
  import ResultItem from '../ResultItem.svelte'
  import ResultItemPreview from '../ResultItemPreview.svelte'
  import VirtualList from '../VirtualList.svelte'

  let keyword = ''
  let selectedIndex = 0;
  let list = []
  let detail = null

  $: if (list) {
    // list变化时，selectedIndex归0
    selectedIndex = 0
  }
  afterUpdate(() => {
    if (window.innerHeight < 80) {
      return;
    }
    // @ts-ignore
    document.querySelector('.result-item.selected')?.scrollIntoViewIfNeeded(false)
  })

  const keydownHandler = (e: KeyboardEvent) => {
    console.log(e)
    const listLength = list.length || 1
    if (e.key === 'ArrowUp') {
      selectedIndex = Math.max(0, selectedIndex - 1)
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

  const onEnter = (item) => {
    // @ts-ignore
    window._plugin.onEnter(item);
  }

  const exitPlugin = () => {
    window.publicApp.exitPlugin();
  }

  onMount(() => {
    document.addEventListener('keydown', keydownHandler)
  })

  // @ts-ignore
  window.plugin = {
    async onInput(keyword) {
      // @ts-ignore
      list = await window._plugin.onInput(keyword);
    }
  }
</script>

<div class="list-preview">
  <InputBar value={keyword}
    on:back={exitPlugin}
    showBack />
  <div class="result-view">
    <div class="result-list-container" style="flex: 1">
      <VirtualList list={list} let:item={item} let:index={index}>
        <ResultItem
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          on:mouseenter={() => selectedIndex = index}
          selected={index === selectedIndex}
          onEnter={() => onEnter(item)}></ResultItem>
      </VirtualList>
    </div>
    {#if detail}
    <ResultItemPreview>{@html detail}</ResultItemPreview>
    {/if}
  </div>
</div>

<style>

.result-view {
  display: flex;
  background: #fff;
}
.result-list-container {
  flex: 3;
  max-height: 540px;
  overflow: auto;
}

/* 滚动槽 */
::-webkit-scrollbar {
    width: 12px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.06);
}
/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.12);
}
</style>