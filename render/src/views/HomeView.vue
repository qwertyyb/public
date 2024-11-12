<template>
  <div class="home-view">
    <InputBar v-model="keyword"
      :command="command"
      @exit="exitCommand"
      :disabled="inputDisable"
    />
    <ResultView :results="results"
      v-if="!command"
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
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { computed } from 'vue';

const results = ref<IPluginCommand[]>([])
const preview = ref<string | HTMLElement | undefined>('')
const inputDisable = ref(false)
const keyword = ref('')
const command = ref<IPluginCommand | null>(null)
const commandAndKeyword = computed(() => ({ command: command.value, keyword: keyword.value }))

watch(commandAndKeyword, ({ keyword: value }) => {
  if (command.value) {
    window.publicApp?.inputBar.setValue(value)
    return
  }
  if (value) {
    results.value = window.pluginManager?.handleQuery(value) || []
  } else {
    results.value = []
  }
})

const focusInput = () => {
  const el = document.querySelector<HTMLInputElement>('#main-input')
  el?.focus()
}

const onResultEnter = (item: IPluginCommand | null, itemIndex: number) => {
  if (command.value) return
  window.pluginManager?.handleEnter(toRaw(results.value[itemIndex]))
}

const onResultSelected = async (item: IPluginCommand | null, itemIndex: number) => {
  if (command.value) return
  preview.value = await window.pluginManager?.handleSelect(toRaw(results.value[itemIndex]), keyword.value)
}

const onResultAction = async (item: IPluginCommand, itemIndex: number, action: IActionItem) => {
  window.pluginManager?.handleAction(toRaw(item), toRaw(action), keyword.value)
}

const setInputBarValue = (event: CustomEvent<{ value: string }>) => {
  const { value } = event.detail;
  keyword.value = value
}

const setPluginResults = (e: CustomEvent<{ commands: IPluginCommand[] }>) => {
  const { commands } = e.detail || {}
  results.value = commands
}

const setInputBarDisable = (e: CustomEvent<{ disable: boolean }>) => {
  inputDisable.value = e.detail.disable
}

let preKeyword = ''
const enterSubInput = (e: CustomEvent<{ name: string, query?: string, command: IPluginCommand }>) => {
  preKeyword = keyword.value
  keyword.value = e.detail.query ?? ''
  command.value = e.detail.command
}

const exitCommand = () => {
  if (!command.value) return
  window.publicApp?.exit(command.value.name)
  command.value = null
  inputDisable.value = false
  keyword.value = preKeyword
  setTimeout(() => {
    focusInput()
  })
}


declare global {
  interface WindowEventMap {
    'publicApp.mainWindow.show': CustomEvent<{}>;
    'plugin:showCommands': CustomEvent<{ name: string, commands: IPluginCommand[] }>;
    'inputBar.setValue': CustomEvent<{ value: string }>;
    'inputBar.enter': CustomEvent<{ name: string, query?: string, command: IPluginCommand }>,
    'inputBar.disable': CustomEvent<{ disable: boolean }>
  }
}

onMounted(() => {
  window.addEventListener('plugin:showCommands', setPluginResults)
  window.addEventListener('publicApp.mainWindow.show', focusInput)
  window.addEventListener('inputBar.setValue', setInputBarValue)
  window.addEventListener('inputBar.enter', enterSubInput)
  window.addEventListener('inputBar.disable', setInputBarDisable)
  window.addEventListener('command.exit', exitCommand)
})

onBeforeUnmount(() => {
  window.removeEventListener('plugin:showCommands', setPluginResults)
  window.removeEventListener('publicApp.mainWindow.show', focusInput)
  window.removeEventListener('inputBar.setValue', setInputBarValue)
  window.removeEventListener('inputBar.enter', enterSubInput)
  window.removeEventListener('inputBar.disable', setInputBarDisable)
  window.removeEventListener('command.exit', exitCommand)
})
</script>

<style lang="scss" scoped>
.home-view {
  display: flex;
  flex-direction: column;
  height: 100%;
	color: light-dark(#444, #ccc);
  background-color: light-dark(#e5e8e8, #161616);
}
.home-view > :deep(*) {
  width: 100%;
}
</style>