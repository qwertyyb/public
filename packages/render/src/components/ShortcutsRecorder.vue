<template>
  <div
    class="shortcuts-recorder flex items-center cursor-pointer"
    :class="{'recording': isRecording, 'large': size === 'large', 'small': size === 'small' }">
    <div class="prefix" v-if="!isRecording && modelValue"></div>
    <ShortcutsKey :shortcuts="keys"
      tabindex="0"
      @focus="startRecord"
      @blur="stopRecord"
    ></ShortcutsKey>
    <el-icon :size="13"
      class="close-icon cursor-pointer"
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

defineProps<{ size?: 'small' | 'large'}>()

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
  let lastModifierKeydownTime = 0
  let lastKey = ''
  const repeatKeydownInterval = 200
  const ModifierKeys = ['Meta', 'Control', 'Alt', 'Shift']
  return (event: KeyboardEvent) => {
    event.preventDefault()

    if (ModifierKeys.includes(event.key)) {
      // 按下的修饰键，首先判断是否是连续第二次按下同样的键
      if (Date.now() - lastModifierKeydownTime < repeatKeydownInterval && lastKey === event.key) {
        const key = { modifiers: [lastKey, event.key], key: '' }
        onChange(key)
        done(key)
      }
      lastModifierKeydownTime = Date.now()
    }
    lastKey = event.key

    // 根据修饰按键的状态获取平台对应的键名
    const activeModifiers = ModifierKeys.filter(key => event.getModifierState(key))
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
    recordedKeys.value = [...key.modifiers, key.key].filter(i => i).join('+')
    console.log(recordedKeys.value)
  }, key => {
    stopRecord()
    const value = [...key.modifiers, key.key].filter(i => i).join('+')
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
.shortcuts-recorder {
  border-radius: 4px;
  &.large {
    padding: 4px 16px;
    width: 160px;
    justify-content: center;
  }
  &.recording {
    opacity: 0.2;
  }
  .prefix {
    display: block;
    width: 32px;
    height: 24px;
  }
}
.shortcuts-recorder:hover .close-icon {
  opacity: 1;
}
.close-icon {
  opacity: 0;
  transition: opacity 0.3s;
  margin-left: 8px;
  width: 24px;
  font-weight: bold;
}
</style>