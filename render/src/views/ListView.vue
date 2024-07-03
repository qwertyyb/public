<template>
  <main>
    <div class="list-view">
      <LoadingBar v-if="loading" />
      <ResultView :results="results"
        :preview="preview"
        @select="onResultSelected"
        @enter="onResultEnter"
        @action="onResultAction"
      ></ResultView>
    </div>
  </main>
</template>

<script setup lang="ts">
import ResultView from '@/components/ResultView.vue';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ListItem } from '../../../shared/types/plugin';
import LoadingBar from '@/components/LoadingBar.vue';
import type { IActionItem } from '@/components/ActionList.vue';

declare global {
  interface WindowEventMap {
    'inputBar.setValue': CustomEvent<{ value: string }>;
    'listchanged': CustomEvent<{ list: ListItem[] }>;
  }
  interface Window {
    plugin?: {
      search: (keyword: string, setList: (list: ListItem[]) => void) => void,
      select?: (item: ListItem, itemIndex: number, keyword: string) => Promise<string>,
      enter?: (item: ListItem, itemIndex: number, keyword: string) => void,
      action?: (item: ListItem, action: IActionItem, keyword: string) => void,
    },
    pluginData?: { list: ListItem[] },
    launchParameter?: { query: string }
  }
}

const results = ref<ListItem[]>([])
const preview = ref<string | HTMLElement | undefined>('')
const keyword = ref(window.launchParameter?.query ?? '')

const loading = ref(false)

watch(keyword, (value) => {
  loading.value = true
  try {
    window.plugin?.search(value, (list) => {
      if (value !== keyword.value) return
      results.value = list
      loading.value = false
    })
  } catch (err) {
    loading.value = false
  }
}, { immediate: true})

const onResultEnter = (item: ListItem, itemIndex: number) => {
  window.plugin?.enter?.(item, itemIndex, keyword.value)
}

const onResultSelected = async (item: ListItem | null, itemIndex: number) => {
  if (!item) {
    preview.value = ''
    return
  }
  preview.value = await window.plugin?.select?.(item, itemIndex, keyword.value)
}

const onResultAction = (item: ListItem, itemIndex: number, action: IActionItem) => {
  window.plugin?.action?.(item, action, keyword.value)
}

const setInputValue = (event: CustomEvent<{ value: string }>) => {
  keyword.value = event.detail.value
}

const setPluginResults = (event: CustomEvent<{ list: ListItem[] }>) => {
  results.value = event.detail.list || []
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
}
.list-view > :v-deep(*) {
  width: 100%;
}
</style>