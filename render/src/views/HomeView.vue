<template>
  <main>
    <div class="home-view">
      <InputBar v-model="keyword"
        :command="command"
        @exit="exitCommand"
        :disable="inputDisable"
      />
      <ResultView :results="results"
        v-if="!command"
        :preview="preview"
        @select="onResultSelected"
        @enter="onResultEnter"></ResultView>
    </div>
  </main>
</template>

<script setup lang="ts">
import InputBar from '@/components/InputBar.vue';
import ResultView from '@/components/ResultView.vue';
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import type { PluginCommand } from '../../../shared/types/plugin';

const results = ref<PluginCommand[]>([])
const preview = ref<string | HTMLElement | undefined>('')
const inputDisable = ref(false)
const keyword = ref('')
const command = ref<PluginCommand | null>(null)

watch(keyword, (value) => {
  if (command.value) {
    window.PluginManager?.setSubInputValue(value)
    return
  }
  if (value) {
    results.value = window.PluginManager?.handleQuery(value) || []
  } else {
    results.value = []
  }
})

const focusInput = () => {
  const el = document.querySelector<HTMLInputElement>('#main-input')
  el?.focus()
}

const onResultEnter = (item: PluginCommand | null, itemIndex: number) => {
  if (command.value) return
  window.PluginManager?.handleEnter(toRaw(results.value[itemIndex]))
}

const onResultSelected = async (item: PluginCommand | null, itemIndex: number) => {
  if (command.value) return
  preview.value = await window.PluginManager?.handleSelect(toRaw(results.value[itemIndex]), keyword.value)
}

const setInputBarValue = (event: CustomEvent<{ value: string }>) => {
  const { value } = event.detail;
  keyword.value = value
}

const setPluginResults = (e: CustomEvent<{ commands: PluginCommand[] }>) => {
  const { commands } = e.detail || {}
  results.value = commands
}

const setInputBarDisable = (e: CustomEvent<{ disable: boolean }>) => {
  inputDisable.value = e.detail.disable
}

let preKeyword = ''
const enterSubInput = (e: CustomEvent<{ name: string, query?: string, command: PluginCommand }>) => {
  preKeyword = keyword.value
  keyword.value = e.detail.query ?? ''
  command.value = e.detail.command
}

const exitCommand = () => {
  if (!command.value) return
  command.value = null
  window.PluginManager?.exitPlugin('xxx')
  inputDisable.value = false
  keyword.value = preKeyword
  setTimeout(() => {
    focusInput()
  })
}


declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:showCommands': CustomEvent<{ name: string, commands: PluginCommand[] }>;
    'inputBar.setValue': CustomEvent<{ value: string }>;
    'inputBar.enter': CustomEvent<{ name: string, query?: string, command: PluginCommand }>,
    'inputBar.disable': CustomEvent<{ disable: boolean }>
  }
}

onMounted(() => {
  window.addEventListener('plugin:showCommands', setPluginResults)
  window.addEventListener('publicApp.mainWindow.show', focusInput)
  window.addEventListener('inputBar.setValue', setInputBarValue)
  window.addEventListener('inputBar.enter', enterSubInput)
  window.addEventListener('inputBar.disable', setInputBarDisable)
})

onBeforeUnmount(() => {
  window.removeEventListener('plugin:showCommands', setPluginResults)
  window.removeEventListener('publicApp.mainWindow.show', focusInput)
  window.removeEventListener('inputBar.setValue', setInputBarValue)
  window.removeEventListener('inputBar.enter', enterSubInput)
  window.removeEventListener('inputBar.disable', setInputBarDisable)
})
</script>

<style lang="scss" scoped>
.home-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.home-view::v-deep > * {
  width: 100%;
}
</style>