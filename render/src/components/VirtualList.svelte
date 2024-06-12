<script lang="ts">
import { onMount, tick, onDestroy } from 'svelte'

export let list;
export let keeps = 30;
export let itemHeight = 48;

let listWrapper;
let startOffset = 0;
let start = 0;
let totalHeight = 0;

let offset = 0;

let prevList = list;

$: if (prevList !== list) {
  totalHeight = list.length * itemHeight
  offset = 0
  start = 0
  startOffset = 0
  prevList = list
}
$: {
  visibleList = list.slice(start, start + keeps)
}

let visibleList = [];

const scrollDownHandler = () => {
  
  const prevCount = 10

  // 最小值为0，并且前面预留10个位置
  startOffset = Math.max((listWrapper?.scrollTop ?? 0) - itemHeight * prevCount, 0)

  // 最大值不可超过最大滚动高度
  startOffset = Math.min(totalHeight - itemHeight * keeps, startOffset)

  start = Math.floor(startOffset / itemHeight)
}

const scrollUpHandler = () => {
  const scrollTop = listWrapper.scrollTop
  const clientHeight = listWrapper.clientHeight
  const bottom = totalHeight - clientHeight - scrollTop
  let offsetBottom = Math.floor(bottom / itemHeight / 10) * itemHeight * 9
  offsetBottom = Math.min(totalHeight - itemHeight * keeps, offsetBottom)
  const end = Math.max(keeps, Math.floor(offsetBottom / itemHeight))
  start = list.length - end
  startOffset = totalHeight - keeps * itemHeight - offsetBottom
}

const scrollHandler = () => {
  scrollDownHandler()
}

onMount(() => {
  listWrapper?.addEventListener('scroll', scrollHandler)
})

onDestroy(() => {
  listWrapper?.removeEventListener('scroll', scrollHandler)
})

</script>

<div class="virtual-list"
  bind:this={listWrapper}>
  <div class="virtual-list__inner"
    style="padding-top:{startOffset}px;min-height:{totalHeight}px">
    {#each visibleList as item, index (item)}
      <slot item={item} index={start + index}></slot>
    {/each}
  </div>
</div>

<style>
.virtual-list {
  overflow: auto;
  max-height: calc(54px * 9);
}
.virtual-list__inner {
  box-sizing: border-box;
}
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.5);
}
</style>