<template>
  <div class="keyboard-key">{{ keyValue }}</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{ value: string }>()

const keyValue = computed(() => {
  const keyMap: Record<string, string | undefined> = {
    command: '⌘',
    enter: '↵',
    option: '⌥',
    shift: '⇧',
    control: '^'
  }
  return keyMap[props.value] || props.value
})

</script>

<style lang="scss" scoped>
.keyboard-key {
  background: light-dark(#e0e0e0, #3e3e3e);
  height: 20px;
  width: 20px;
  text-align: center;
  line-height: 20px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 2px;
}
</style>