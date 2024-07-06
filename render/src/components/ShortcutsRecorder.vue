<template>
  <div
    class="shortcuts-recorder cursor-pointer px-1 py-1 transition box-border border border-transparent hover:border-slate-500 hover:rounded flex items-center"
    :class="{'opacity-50': isRecording}">
    <ShortcutsKey :shortcuts="keys"
      tabindex="0"
      @focus="startRecord"
      @blur="stopRecord"
    ></ShortcutsKey>
    <el-icon :size="16"
      class="close-icon ml-1 opacity-0"
      v-if="!isRecording && modelValue"
      @click.stop.prevent="clear"><Close /></el-icon>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import ShortcutsKey from './ShortcutsKey.vue';
import { ElIcon } from 'element-plus';
import { Close } from '@element-plus/icons-vue'

const modelValue = defineModel<string>({ required: true })

const isRecording = ref(false)

const recordedKeys = ref<string>('')

const keys = computed(() => {
  if (isRecording.value) {
    return recordedKeys.value.length ? recordedKeys.value : '-+-'
  }
  return modelValue.value?.length ? modelValue.value : '-+-'
})

interface Key {
  modifiers: string[],
  key: string
}

const createKeyEventHandler = (onChange: (value: Key) => void, done: (value: Key) => void) => {
  const key: Key = {
    modifiers: [],
    key: ''
  }
  return (event: KeyboardEvent) => {
    event.preventDefault()
    const detectKeys = ['Meta', 'Control', 'Alt', 'Shift']
    // 根据修饰按键的状态获取平台对应的键名
    const activeModifiers = detectKeys.filter(key => event.getModifierState(key))
    // 排下序，已经按下过的放在前面
    // 先去掉已经抬起的键
    let modifiers = key.modifiers.filter(label => activeModifiers.includes(label))
    // 加上本次按下的键
    modifiers = modifiers.concat(...activeModifiers.filter(label => !modifiers.includes(label)))
    key.modifiers = modifiers

    if (event.type === 'keydown' && (/^[a-zA-Z]$/.test(event.key) || event.code === 'Space')) {
      const keyLabel = event.code === 'Space' ? 'Space' : event.key.toUpperCase()
      key.key = keyLabel
    } else {
      key.key = ''
    }
    onChange(key)

    if (key.modifiers.length && key.key) {
      done(key)
    }
  }
}


let clearListener: (() => void) | null = null

const startRecord = () => {
  stopRecord()

  const keyEventHandler = createKeyEventHandler(key => {
    recordedKeys.value = [...key.modifiers, key.key].join('+')
  }, key => {
    stopRecord()
    const value = [...key.modifiers, key.key].join('+')
    modelValue.value = value
  })
  clearListener = () => {
    document.removeEventListener('keydown', keyEventHandler)
    document.removeEventListener('keyup', keyEventHandler)
  }
  isRecording.value = true
  document.addEventListener('keydown', keyEventHandler)
  document.addEventListener('keyup', keyEventHandler)
}

const stopRecord = () => {
  if (clearListener) {
    clearListener()
    clearListener = null
  }
  isRecording.value = false
}

const clear = () => {
  modelValue.value = ''
  recordedKeys.value = ''
}

</script>

<style lang="scss" scoped>
.shortcuts-recorder:hover .close-icon {
  opacity: 1;
}
</style>