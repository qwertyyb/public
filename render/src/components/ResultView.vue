<template>
  <div class="resultView">
    <div class="resultsListContainer">
      <VirtualList
        :list="results"
        :keeps="30"
        :item-height="54"
        v-slot="{ item, index }"
      >
        <ResultItem
          :index="index"
          :icon="item.icon"
          :title="item.title"
          :subtitle="item.subtitle"
          :selected="selectedIndex === index"
          :actionKey="getActionKey(index, actionKeyStartIndex)"
          :actionsVisible="visibleActionIndex === index"
          @select="selectedIndex = index;$emit('select', item, index)"
          @enter="selectedIndex = index;$emit('enter', item, index)"
        ></ResultItem>
      </VirtualList>
    </div>
    <ResultItemPreview :html="preview" v-if="preview"></ResultItemPreview>
  </div>
</template>

<script setup lang="ts" generic="T extends ListItem">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import VirtualList from '@/components/VirtualList.vue';
import ResultItem from '@/components/ResultItem.vue';
import ResultItemPreview from '@/components/ResultItemPreview.vue';
import type { ListItem } from '../../../shared/types/plugin';

const props = withDefaults(defineProps<{
  results: T[],
  preview?: string | HTMLElement
}>(), { results: () => [] })

const emit = defineEmits<{
  enter: [item: T, index: number],
  select: [item: T | null, index: number]
}>()

const selectedIndex = ref(0)
const visibleActionIndex = ref(-1)
const actionKeyStartIndex = ref(0)

const selectedItem = computed(() => props.results[selectedIndex.value])

const getPreview = async (item: T) => {
  if (!item) return emit('select', null, -1)
  emit('select', item, selectedIndex.value)
}

// selectedIndex 变化时，滚动到选择位置，调用preview
const calcActionKeyStartIndex = () => {
  (document.querySelector<HTMLElement>(`.result-item[data-result-item-index="${selectedIndex.value}"]`) as any)?.scrollIntoViewIfNeeded(false)
  const parentRect = document.querySelector('div.virtual-list')!.getBoundingClientRect()
  const els = document.querySelectorAll<HTMLElement>('.result-item[data-result-item-index]')
  let visibleIndexList: number[] = []
  els.forEach(item => {
    const rect = item.getBoundingClientRect()
    const visible = rect.top + rect.height / 2 >= parentRect.top && rect.top + rect.height / 2 <= parentRect.bottom
    if (visible) {
      visibleIndexList.push(parseInt(item.dataset.resultItemIndex as string, 10))
    }
  })
  actionKeyStartIndex.value = visibleIndexList[0]
}

watch(selectedItem, getPreview)
watch(selectedItem, calcActionKeyStartIndex, { flush: 'post' })

watch(() => props.results, () => { selectedIndex.value = 0 })

const onResultEnter = (index: number) => {
  emit('enter', props.results[index], index)
}

const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    selectedIndex.value = (Math.max(0, selectedIndex.value - 1))
    e.stopPropagation()
    e.preventDefault()
  } else if(e.key === 'ArrowDown') {
    selectedIndex.value = (Math.min(selectedIndex.value + 1, props.results.length - 1))
    e.stopPropagation()
    e.preventDefault()
  } else if (e.key === 'Enter' && e.shiftKey || e.key === 'ArrowRight') {
    e.stopPropagation()
    e.preventDefault()
    visibleActionIndex.value = selectedIndex.value
  } else if(e.key === 'Enter') {
    onResultEnter(selectedIndex.value)
    e.stopPropagation()
  } else if (e.metaKey && /^\d$/.test(e.key)) {
    const key = parseInt(e.key, 10)
    selectedIndex.value = actionKeyStartIndex.value + key - 1
    onResultEnter(selectedIndex.value)
    e.stopPropagation()
  }
}

const getActionKey = (index: number, indexStart: number) => {
  const key = index - indexStart + 1
  if (key > 0 && key <= 9) return String(key)
  return ''
}

onMounted(() => {
  document.addEventListener('keydown', keydownHandler)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', keydownHandler)
})

</script>

<style lang="scss" scoped>
.resultView {
  display: flex;
}
.resultsListContainer {
  flex: 2;
  overflow: auto;
}

/* 滚动槽 */
::-webkit-scrollbar {
    width: 5px;
    height: 6px;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
}
/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.3);
    border-radius: 9999px;
}
</style>