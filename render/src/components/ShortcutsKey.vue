<template>
  <div class="shortcuts">
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
  return props.shortcuts
})

</script>

<style lang="scss" scoped>
.shortcuts {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  margin-left: 12px;
}
</style>