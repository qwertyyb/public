<template>
  <ul class="action-list">
    <li class="action-item" v-for="(action, index) in actions" :key="index">
      <div class="material-symbols-outlined action-icon">{{ action.icon }}</div>
      <div class="action-title">{{ action.title }}</div>
      <ShortcutsKey :shortcuts="action.shortcuts" v-if="action.shortcuts"></ShortcutsKey>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import ShortcutsKey from '@/components/ShortcutsKey.vue';

export interface IActionItem {
  name: string,
  icon: string
  title: string
  shortcuts?: string
}

defineProps<{ actions: IActionItem[] }>()

</script>

<style lang="scss" scoped>
.action-list {
  border-left: 1px solid light-dark(#c0c0c0, #333);
  height: var(--container-height);
  overflow: hidden;
  width: 200px;
}
.action-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  position: relative;
  padding: 6px 8px;
  cursor: pointer;
}
.action-item:hover {
  background: #e4e4e4;
}
.action-item .action-icon {
  width: 20px;
  height: auto;
  margin-bottom: 2px;
  margin-right: 8px;
}
.action-item .action-title {
  white-space: nowrap;
  font-size: 11px;
  color: #444;
  margin-right: auto;
  padding-right: 10px;
}
</style>