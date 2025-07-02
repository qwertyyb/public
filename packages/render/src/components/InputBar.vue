<template>
  <div class="inputBar" @pointerup="inputEl?.focus()" tabindex="0" :class="{'is-main-input': isMainInput}">
    <input
      autofocus
      v-if="!disabled"
      class="input"
      ref="input"
      @keydown="keyDownHandler"
      v-model="modelValue"
      id="main-input" />
    <div class="input-placeholder" v-if="!disabled && !modelValue">{{ placeholder }}</div>
    <div class="searchSpace"></div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { onPageEnter } from '@/router/hooks';

const modelValue = defineModel({ default: '' })
const props = defineProps<{
  command?: { icon: string } | null,
  disabled?: boolean,
  isMainInput?: boolean,
}>()
const emits = defineEmits<{ escape: [] }>()

const inputEl = useTemplateRef('input')
const placeholder = ref('search...')

const keyDownHandler = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (modelValue.value) {
      event.preventDefault()
      modelValue.value = ''
    } else {
      event.preventDefault()
      emits('escape')
    }
  } else if (event.key === 'Backspace' && !modelValue.value && !event.isComposing) {
    event.preventDefault()
    emits('escape')
  }
}

const fetchPlaceholder = async () => {
  const r = await fetch('https://v1.hitokoto.cn/')
  const json = await r.json()
  placeholder.value = json?.hitokoto || '欢迎使用 Public App'
}

const popToRootHandler = (e: any) => {
  if (e.detail?.clearInput && props.isMainInput) {
    modelValue.value = ''
  }
}

onMounted(() => {
  window.addEventListener('pop-to-root', popToRootHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('pop-to-root', popToRootHandler)
})

onPageEnter(() => {
  inputEl.value?.focus()
  if (props.isMainInput) {
    fetchPlaceholder()
  }
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
  --padding-left: calc(var(--nav-width, 0px) + 16px);
  &.is-main-input {
    --padding-left: 16px;
  }
}
.input {
  height: 42px;
  line-height: 42px;
  min-height: 42px;
  font-size: 18px;
  padding: 0 32px 0 var(--padding-left);
  min-width: 4em;
  box-sizing: border-box;
  outline: none;
  border: none;
  background: none;
  field-sizing: content;
  font-weight: 500;
  width: fit-content;
  min-width: 42px;
}
.input-placeholder {
  color: light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.4));
  position: absolute;
  left: var(--padding-left);
  top: 0;
  height: 48px;
  line-height: 48px;
  font-size: 16px;
  pointer-events: none;
  opacity: 0;
}
.input:empty + .input-placeholder {
  opacity: 1;
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