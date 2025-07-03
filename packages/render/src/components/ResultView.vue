<template>
  <div class="resultView" ref="el">
    <VirtualList class="result-list"
      :data-sources="results"
      :keeps="30"
      :estimate-size="54"
      :data-key="'title'"
      ref="virtualList"
      v-slot="{ source: item, index }"
    >
      <ResultItem
        :key="index"
        :index="index"
        :icon="item.icon"
        :title="item.title"
        :subtitle="item.subtitle"
        :selected="selectedIndex === index"
        :actionKey="getActionKey(index, actionKeyStartIndex)"
        @select="selectedIndex = index;$emit('select', item, index)"
        @enter="selectedIndex = index;$emit('enter', item, index)"
      ></ResultItem>
    </VirtualList>
    <ActionList
      :actions="selectedItem.actions!"
      v-if="visibleActionIndex === selectedIndex && (selectedItem?.actions?.length || 0) > 0"
      @action="onResultAction"
    ></ActionList>
    <ResultItemPreview :html="preview" v-if="results.length && preview"></ResultItemPreview>
  </div>
</template>

<script setup lang="ts" generic="T extends IListItem">
import { computed, ref, useTemplateRef, watch } from 'vue';
import ResultItem from '@/components/ResultItem.vue';
import ActionList, { type IActionItem } from '@/components/ActionList.vue';
import ResultItemPreview from '@/components/ResultItemPreview.vue';
import { curry } from 'ramda';
import { isKeyPressed } from '@/utils/keyboard';
import type { IListItem } from '@public/shared';
import { onPageEnter, onPageLeave } from '@/router/hooks';

const props = withDefaults(defineProps<{
  results: T[],
  preview?: string | HTMLElement
}>(), { results: () => [] })

const emit = defineEmits<{
  enter: [item: T, index: number],
  select: [item: T | null, index: number],
  action: [item: T, index: number, action: IActionItem]
}>()

const selectedIndex = ref(0)
const visibleActionIndex = ref(-1)
const actionKeyStartIndex = ref(0)

const selectedItem = computed(() => props.results[selectedIndex.value])

const virtualList = useTemplateRef<{ scrollToIndex: (index: number) => void }>('virtualList')
const el = useTemplateRef('el')

const getPreview = async (item: T) => {
  if (!item) return emit('select', null, -1)
  emit('select', item, selectedIndex.value)
}

// selectedIndex 变化时，滚动到选择位置，调用preview
const calcActionKeyStartIndex = () => {
  if (!el.value) return;
  (el.value.querySelector<HTMLElement>(`.result-item[data-result-item-index="${selectedIndex.value}"]`) as any)?.scrollIntoView({ inline: 'center', block: 'center', behavior: 'smooth' })
  const parentRect = el.value.querySelector('div.result-list')!.getBoundingClientRect()
  const els = el.value.querySelectorAll<HTMLElement>('.result-item[data-result-item-index]')
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

watch(selectedItem, (value) => {
  visibleActionIndex.value = -1
  // virtualList.value?.scrollToIndex(Math.max(0, selectedIndex.value - 4))
  getPreview(value)
}, { immediate: true })
watch(selectedItem, () => setTimeout(calcActionKeyStartIndex, 600), { flush: 'post' })

watch(() => props.results, () => { console.log('result'); selectedIndex.value = 0 })

const onResultEnter = (index: number) => {
  emit('enter', props.results[index], index)
}

const highlightAction = (actionName: string) => {
  const actionEl = document.querySelector(`[data-action-name=${JSON.stringify(actionName)}]`)
  if (!actionEl) return;
  actionEl.classList.add('flash')
  setTimeout(() => {
    actionEl.classList.remove('flash')
  }, 400)
}

const onResultAction = (action: IActionItem) => {
  emit('action', selectedItem.value, selectedIndex.value, action)
  highlightAction(action.name)
}

const keydownHandler = (e: KeyboardEvent) => {
  const checkKey = curry(isKeyPressed)(e)

  if (checkKey('ArrowUp')) {
    selectedIndex.value = (Math.max(0, selectedIndex.value - 1))
    e.stopPropagation()
    e.preventDefault()
  } else if(checkKey('ArrowDown')) {
    selectedIndex.value = (Math.min(selectedIndex.value + 1, props.results.length - 1))
    console.log('selectedIndex', selectedIndex.value)
    e.stopPropagation()
    e.preventDefault()
  } else if (checkKey('Shift+Enter')) {
    e.stopPropagation()
    e.preventDefault()
    visibleActionIndex.value = selectedIndex.value
  } else if(checkKey('Enter')) {
    e.stopPropagation()
    e.preventDefault()
    onResultEnter(selectedIndex.value)
  } else if (e.metaKey && /^\d$/.test(e.key)) {
    const key = parseInt(e.key, 10)
    selectedIndex.value = actionKeyStartIndex.value + key - 1
    onResultEnter(selectedIndex.value)
    e.stopPropagation()
  } else if (selectedItem.value?.actions) {
    const actions = [...selectedItem.value?.actions ?? []]
    const action = actions.find(action => checkKey(action.shortcuts))
    if (!action) return
    onResultAction(action)
  }
}

const getActionKey = (index: number, indexStart: number) => {
  const key = index - indexStart + 1
  if (key > 0 && key <= 9) return String(key)
  return ''
}

onPageEnter(() => {
  document.addEventListener('keydown', keydownHandler)
})
onPageLeave(() => {
  document.removeEventListener('keydown', keydownHandler)
})

</script>

<style lang="scss" scoped>
.resultView {
  display: flex;
  --container-height: 486px;
}
.result-list {
  flex: 3;
  max-height: var(--container-height);
  min-height: var(--container-height);
  overflow: auto;
  height: var(--container-height);
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