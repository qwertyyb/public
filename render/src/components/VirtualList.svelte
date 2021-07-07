<script lang="ts">
import { onMount, tick, onDestroy } from 'svelte'

export let list;
export let keeps = 30;
export let itemHeight = 60;

let listWrapper;
let scrollOffset = 0;
let start = 0;
let totalHeight = 0;
let paddingBottom = 0;

let offset = 0;

$: {
  totalHeight = list.length * itemHeight
  offset = 0
  start = 0
  scrollOffset = 0
  paddingBottom = Math.max(0, totalHeight - scrollOffset - itemHeight * keeps)
}
$: {
  visibleList = list.slice(start, start + keeps)
}

let visibleList = [];

const scrollDownHandler = () => {
  const s = Math.max((listWrapper?.scrollTop ?? 0) - itemHeight * 10, 0)
  scrollOffset = Math.floor(s / itemHeight / 10) * itemHeight * 10
  scrollOffset = Math.min(totalHeight - itemHeight * keeps, scrollOffset)
  start = Math.min(list.length - keeps - 10, Math.floor(scrollOffset / itemHeight))
  start = Math.max(0, start);
}

const scrollUpHandler = () => {
  const scrollTop = listWrapper.scrollTop
  const clientHeight = listWrapper.clientHeight
  const bottom = totalHeight - clientHeight - scrollTop
  let offsetBottom = Math.floor(bottom / itemHeight / 10) * itemHeight * 9
  offsetBottom = Math.min(totalHeight - itemHeight * keeps, offsetBottom)
  const end = Math.max(keeps, Math.floor(offsetBottom / itemHeight))
  start = list.length - end
  scrollOffset = totalHeight - keeps * itemHeight - offsetBottom
}

const scrollHandler = () => {
  if (listWrapper?.scrollTop >= offset || true) {
    scrollDownHandler()
  } else {
    scrollUpHandler()
  }
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
    style="padding-top:{scrollOffset}px;padding-bottom:{paddingBottom}px">
    {#each visibleList as item, index (item)}
      <slot item={item} index={start + index}></slot>
    {/each}
  </div>
</div>

<style>
.virtual-list {
  overflow: auto;
  max-height: 540px;
}
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