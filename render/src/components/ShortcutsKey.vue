<template>
  <div class="shortcuts-key p-2 rounded">
    <KeyboardKey v-for="(item, index) in keys" :key="index" :value="item"></KeyboardKey>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import KeyboardKey from '@/components/KeyboardKey.vue';

const props = defineProps<{ shortcuts: string | string[] }>()

const keys = computed(() => {
  if (typeof props.shortcuts === 'string') {
    return props.shortcuts.split('+')
  }
  return props.shortcuts || ['', '']
})

</script>

<style lang="scss" scoped>
.shortcuts-key {
  display: flex;
  flex-shrink: 0;
  &:hover {
    background: rgba(0, 0, 0, .1);
  }
}
.shortcuts-key :deep(.keyboard-key) + .keyboard-key {
  margin-left: 2px;
}
</style>