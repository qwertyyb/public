<template>
  <div class="inputBar" @click="inputEl?.focus()" tabindex="0">
    <div class="inputBarWrapper">
      <div class="navBack material-symbols-outlined"
        v-if="command"
        @pointerdown="$emit('exit')">
        arrow_back
      </div>
      <input type="text"
        v-if="!disabled"
        class="input"
        placeholder="请搜索"
        v-model="modelValue"
        ref="inputEl"
        id="main-input"/>
      <img :src="command.icon" alt="" class="appLogo" draggable="false" v-if="command" />
      <img src="../assets/logo.svg" alt="" class="appLogo" draggable="false" v-else />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { type PluginCommand } from "../../../shared/types/plugin";

const modelValue = defineModel({ default: '' })
const props = defineProps<{
  command?: PluginCommand | null,
  disabled?: boolean,
}>()
const emit = defineEmits<{ exit: [] }>()

const inputEl = ref<HTMLInputElement>()

const handler = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (modelValue.value) {
      event.preventDefault()
      modelValue.value = ''
    } else if (props.command) {
      event.preventDefault()
      emit('exit')
    } else {
      event.preventDefault()
      window.publicApp?.mainWindow?.hide?.()
    }
  } else if (event.key === 'Backspace' && !modelValue.value) {
    if (props.command) {
      event.preventDefault()
      emit('exit')
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handler)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handler)
})
</script>

<style lang="scss" scoped>
.inputBar {
  height: 48px;
  min-height: 48px;
  max-height: 48px;
  position: relative;
  z-index: 100;
  /* border-bottom: 1px solid #ddd; */
}
.inputBar:focus-within .searchSpace {
  -webkit-app-region: drag;
}
.inputBarWrapper {
  position: fixed;
  height: 48px;
  top: 0;
  left: 0;
  right: 0;
  /* background: #fff; */
  display: flex;
  align-items: center;
}
.inputBarWrapper::after {
  content: " ";
  height: 1px;
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
}
.navBack {
  font-size: 16px;
  height: 100%;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 22px;
}
.backIcon {
  width: 20px;
  height: 20px;
}
.navBack + .input {
  padding-left: 0;
}
.input {
  height: 42px;
  min-height: 42px;
  font-size: 18px;
  padding: 0 12px;
  min-width: 4em;
  box-sizing: border-box;
  outline: none;
  border: none;
  background: none;
  /* field-sizing: content; */
  font-weight: 500;
  flex: 1;
}
.input:focus {
  -webkit-app-region: drag;
}
.input::placeholder {
  font-weight: normal;
}
.searchSpace {
  flex: 1;
  height: 100%;
}
.appLogo {
  width: 36px;
  height: auto;
  cursor: pointer;
  padding: 6px;
}
</style>