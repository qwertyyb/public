<template>
  <div class="inputBar" @pointerdown.capture="inputEl?.focus()" tabindex="0">
    <input type="text"
      autofocus
      v-if="!disabled"
      class="input"
      placeholder="请搜索"
      v-model="modelValue"
      ref="input"
      id="main-input"/>
    <img :src="command.icon" alt="" class="appLogo" draggable="false" v-if="command" />
    <img src="../assets/logo.svg" alt="" class="appLogo" draggable="false" v-else />
  </div>
</template>
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { curry } from 'ramda';
import { isKeyPressed } from '@/utils/keyboard';
import { onPageEnter, onPageLeave } from '@/router/hooks';

const modelValue = defineModel({ default: '' })
defineProps<{
  command?: { icon: string } | null,
  disabled?: boolean,
}>()
const emits = defineEmits<{ escape: [] }>()

const inputEl = useTemplateRef('input')

const handler = (event: KeyboardEvent) => {
  const checkKey = curry(isKeyPressed)(event)
  if (checkKey('Escape')) {
    if (modelValue.value) {
      event.preventDefault()
      modelValue.value = ''
    } else {
      event.preventDefault()
      emits('escape')
    }
  } else if (checkKey('Backspace') && !modelValue.value && !event.isComposing) {
    event.preventDefault()
    emits('escape')
  }
}

onPageEnter(() => {
  inputEl.value?.focus()
  console.log('onPageEnter', inputEl.value, document.activeElement)
  window.addEventListener('keydown', handler)
})

onPageLeave(() => {
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
  border-bottom: 1px solid light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
  display: flex;
  align-items: center;
}
.inputBar:focus-within .searchSpace {
  -webkit-app-region: drag;
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
  margin-left: var(--nav-width, 0);
}
.input:focus {
  -webkit-app-region: drag;
}
.input::placeholder {
  font-weight: normal;
  color: light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.4));
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
  margin-left: auto;
}
</style>