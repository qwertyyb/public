<template>
  <div class="shortcuts-recorder" tabindex="0"
    :class="{'opacity-50': isRecording}"
    @focus="startRecord"
    @blur="stopRecord">
    <ShortcutsKey :shortcuts="keys"></ShortcutsKey>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import ShortcutsKey from './ShortcutsKey.vue';

const modelValue = defineModel<string | string[]>({ required: true })

const emit = defineEmits<{ change: [keys: string[]] }>()

const isRecording = ref(false)

const recordedKeys = ref<string[]>([])

const keys = computed(() => {
  if (isRecording.value) {
    return recordedKeys.value.length ? recordedKeys.value : ['', '']
  }
  return modelValue.value
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
      const keyLabel = event.code === 'Space' ? 'Space' : event.key
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
    console.log('onChange', key)
    recordedKeys.value = [...key.modifiers, key.key]
  }, key => {
    stopRecord()
    console.log('done', key)
    recordedKeys.value = [...key.modifiers, key.key]
    modelValue.value = [...key.modifiers, key.key]
    emit('change', recordedKeys.value)
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

</script>