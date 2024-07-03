<template>
  <div class="resultItem result-item"
    :class="{selected}"
    :data-result-item-index="index"
    @click="$emit('select')"
    @dblclick="$emit('enter')"
  >
    <div class="itemImageWrapper flex-h-v" v-if="icon">
      <img :src="icon" alt=""/>
    </div>
    <div class="itemInfo flex-1 flex-col-center">
      <h3 class="itemTitle text-single-line">{{ title }}</h3>
      <h5 class="itemSubtitle color-666 text-sm text-single-line" v-if="subtitle">{{ subtitle }}</h5>
    </div>
    <div class="actions">
      <ShortcutsKey shortcuts="enter" v-if="selected"></ShortcutsKey>
      <ShortcutsKey :shortcuts="['command', actionKey]" v-else-if="actionKey"></ShortcutsKey>
      <span class="material-symbols-outlined more-icon" ref="moreEl" v-if="(actions?.length || 1) > 1">more_vert</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import ShortcutsKey from '@/components/ShortcutsKey.vue';
import { ref } from 'vue';

interface Action {
  icon: string
  title: string
  shortcuts?: string
}

interface IResultItem {
  icon?: string,
  title: string,
  subtitle?: string,
  actions?: Action[]
}

interface IResultItemProps extends IResultItem {
  index?: number,
  selected?: boolean,
  actionKey?: string,
  actionsVisible?: boolean,
}

defineProps<IResultItemProps>()

defineEmits<{
  select: [],
  enter: []
}>()

const moreEl = ref<HTMLElement>()
 
</script>

<style lang="scss" scoped>
.resultItem {
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  height: 54px;
  max-width: 100%;
  content-visibility: auto;
  contain-intrinsic-size: 54px;
  transition: all .1s;
  padding: 0 12px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
}
.resultItem:hover {
  background-color: light-dark(#c4c4c4, #393939);
}
.resultItem.selected {
  background-color: light-dark(#b4b4b4, #2a2a2a);
}
.itemImageWrapper {
  width: 36px;
  height: 36px;
  margin-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
}
.itemImageWrapper img {
  width: 100%;
  height: 100%;
}
.itemInfo {
  width: 0;
  /* max-width: calc(100% - 90px); */
  flex: 1;
}
.itemTitle {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}
.itemSubtitle {
  font-size: 12px;
  font-weight: normal;
  opacity: 0.6;
  height: 16px;
  white-space: pre;
}
.actions {
  display: flex;
  align-items: center;
}
.more-icon {
  font-size: 20px;
  margin-left: 4px;
  color: #5a5a5a;
}
</style>