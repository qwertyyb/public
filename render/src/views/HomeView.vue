<template>
  <div class="home-view">
    <InputBar v-model="keyword" />
    <ResultView :results="results"
      :preview="preview"
      @select="onResultSelected"
      @enter="onResultEnter"
      @action="onResultAction"
    ></ResultView>
  </div>
</template>

<script setup lang="ts">
import InputBar from '@/components/InputBar.vue';
import ResultView from '@/components/ResultView.vue';
import { type IActionItem, type IPluginCommand } from '@public/shared';
import * as service from '@/services'
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';

const results = ref<IPluginCommand[]>([])
const preview = ref<string | HTMLElement | undefined>('')
const keyword = ref('')

watch(keyword, async (value) => {
  if (value) {
    results.value = await window.pluginManager?.handleQuery(value) || []
  } else {
    results.value = []
  }
})

const focusInput = () => {
  const el = document.querySelector<HTMLInputElement>('#main-input')
  el?.focus()
}

const onResultEnter = (item: IPluginCommand | null, itemIndex: number) => {
  service.enter(toRaw(results.value[itemIndex]), keyword.value)
}

const onResultSelected = async (item: IPluginCommand | null, itemIndex: number) => {
  preview.value = await service.select(toRaw(results.value[itemIndex]), keyword.value)
}

const onResultAction = async (item: IPluginCommand, itemIndex: number, action: IActionItem) => {
  service.action(toRaw(item), toRaw(action), keyword.value)
}

const setPluginResults = (e: CustomEvent<{ commands: IPluginCommand[] }>) => {
  const { commands } = e.detail || {}
  results.value = commands
}

declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:showCommands': CustomEvent<{ name: string, commands: IPluginCommand[] }>;
  }
}

onMounted(() => {
  window.addEventListener('plugin:showCommands', setPluginResults)
  window.addEventListener('publicApp.mainWindow.show', focusInput)
})

onBeforeUnmount(() => {
  window.removeEventListener('plugin:showCommands', setPluginResults)
  window.removeEventListener('publicApp.mainWindow.show', focusInput)
})
</script>

<style lang="scss" scoped>
.home-view {
  display: flex;
  flex-direction: column;
  height: 100%;
	color: light-dark(#444, #ccc);
  // background-color: light-dark(#e5e8e8, #161616);
}
.home-view > :deep(*) {
  width: 100%;
}
</style>