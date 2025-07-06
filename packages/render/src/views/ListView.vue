<template>
  <div class="list-view">
    <InputBar v-model="keyword"
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
import { ref, toRaw, watch } from 'vue';
import { type ICommandMatchData, type IListItem, type IPluginCommand, type IRunningPlugin } from '@public/shared';
import LoadingBar from '@/components/LoadingBar.vue';
import type { IActionItem } from '@/components/ActionList.vue';
import InputBar from '@/components/InputBar.vue';
import { resourceUrl } from '@/utils';
import { onPageEnter, onPageLeave, useRouter } from '@/router/hooks';

const props = defineProps<{
  command: IPluginCommand,
  plugin: IRunningPlugin,
  match: ICommandMatchData
}>()

const results = ref<IListItem[]>([])
const preview = ref<string | HTMLElement | undefined>('')
const keyword = ref(props.match?.query ?? '')
const inputDisable = !window.publicAppCommand?.search

const loadingCount = ref(0)

if (typeof window.publicAppCommand?.enter === 'function') {
  loadingCount.value += 1
  window.publicAppCommand?.enter?.(props.match?.query ?? '', (list) => {
    loadingCount.value -= 1
    if (keyword.value !== (props.match?.query ?? '')) return;
    results.value = list.map(item => {
      return {
        ...item,
        icon: resourceUrl(item.icon, props.plugin.path)
      }
    })
  }, { command: toRaw(props.command) })
}

watch(keyword, window.publicApp.utils.debounce((value) => {
  if (!window.publicAppCommand?.search) return;
  loadingCount.value += 1
  try {
    window.publicAppCommand?.search?.(value, (list) => {
      loadingCount.value -= 1
      if (value !== keyword.value) return
      results.value = list.map(item => {
        return {
          ...item,
          icon: resourceUrl(item.icon, props.plugin.path)
        }
      })
    })
  } catch (err) {
    loadingCount.value -= 1
  }
}, 500), { immediate: true })

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

const router = useRouter()
const exitCommand = () => {
  router?.popView()
}

const keyDownHandler = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !window.publicAppCommand?.search) {
    // 没有搜索功能，则退出的实现交由此处
    event.preventDefault()
    exitCommand()
  }
}

onPageEnter(() => {
  if (!window.publicAppCommand?.search) {
    window.addEventListener('keyup', keyDownHandler)
  }
})

onPageLeave(() => {
  window.removeEventListener('keyup', keyDownHandler)
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