<template>
  <div class="list-view">
    <InputBar v-model="keyword"
      :command="command"
      @escape="exitCommand"
      :disabled="inputDisable"
    />
    <LoadingBar v-if="loadingCount > 0" />
    <ResultView :results="results"
      :preview="preview"
      @select="onResultSelected"
      @enter="onResultEnter"
      @action="onResultAction"
    ></ResultView>
  </div>
</template>

<script setup lang="ts">
import ResultView from '@/components/ResultView.vue';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { type IListItem, type IPluginCommand } from '@public/shared';
import LoadingBar from '@/components/LoadingBar.vue';
import type { IActionItem } from '@/components/ActionList.vue';
import InputBar from '@/components/InputBar.vue';

declare global {
  interface WindowEventMap {
    'inputBar.setValue': CustomEvent<{ value: string }>;
    'listchanged': CustomEvent<{ list: IListItem[] }>;
  }
  interface Window {
    pluginData?: { list: IListItem[] },
    launchParameter?: { query: string, command: IPluginCommand }
  }
}

const results = ref<IListItem[]>([])
const preview = ref<string | HTMLElement | undefined>('')
const keyword = ref(window.launchParameter?.query ?? '')
const command = shallowRef(window.launchParameter?.command)
const inputDisable = !window.publicAppCommand?.search

const loadingCount = ref(0)

if (typeof window.publicAppCommand?.enter === 'function') {
  loadingCount.value += 1
  window.publicAppCommand?.enter?.(window.launchParameter?.query ?? '', (list) => {
    loadingCount.value -= 1
    if (keyword.value !== (window.launchParameter?.query ?? '')) return;
    results.value = list
  })
}

watch(keyword, (value) => {
  if (!window.publicAppCommand?.search) return;
  loadingCount.value += 1
  try {
    window.publicAppCommand?.search?.(value, (list) => {
      loadingCount.value -= 1
      if (value !== keyword.value) return
      results.value = list
    })
  } catch (err) {
    loadingCount.value -= 1
  }
}, { immediate: true})

const onResultEnter = (item: IListItem, itemIndex: number) => {
  window.publicAppCommand?.action?.(item)
}

const onResultSelected = async (item: IListItem | null, itemIndex: number) => {
  if (!item) {
    preview.value = ''
    return
  }
  preview.value = await window.publicAppCommand?.select?.(item, keyword.value)
}

const onResultAction = (item: IListItem, itemIndex: number, action: IActionItem) => {
  // window.publicAppCommand?.action?.(item, action, keyword.value)
}

const setInputValue = (event: CustomEvent<{ value: string }>) => {
  keyword.value = event.detail.value
}

const setPluginResults = (event: CustomEvent<{ list: IListItem[] }>) => {
  results.value = event.detail.list || []
}

const exitCommand = () => {
  window.publicApp.plugin.exitCommand()
}

onMounted(() => {
  window.pluginData?.list && (results.value = window.pluginData?.list || [])
  window.addEventListener('inputBar.setValue', setInputValue)
  window.addEventListener('listchanged', setPluginResults)
})

onBeforeUnmount(() => {
  window.removeEventListener('inputBar.setValue', setInputValue)
  window.removeEventListener('listchanged', setPluginResults)
})
</script>

<style lang="scss" scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
	color: light-dark(#444, #ccc);
  // background-color: light-dark(#e5e8e8, #161616);
}
.list-view > :v-deep(*) {
  width: 100%;
}
</style>