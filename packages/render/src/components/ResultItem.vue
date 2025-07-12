<template>
  <div class="resultItem result-item"
    :class="{selected}"
    :data-result-item-index="index"
    @click="$emit('select')"
    @dblclick="$emit('enter')"
  >
    <div class="itemImageWrapper flex-h-v" v-if="icon">
      <img :src="icon" alt="" loading="lazy" />
    </div>
    <div class="itemInfo flex-1 flex-col-center">
      <h3 class="itemTitle text-single-line" v-html="title"></h3>
      <h5 class="itemSubtitle color-666 text-sm text-single-line" v-if="subtitle" v-html="subtitle"></h5>
    </div>
    <div class="actions cursor-pointer">
      <ShortcutsKey shortcuts="Enter" v-if="selected" @click="$emit('enter')"></ShortcutsKey>
      <ShortcutsKey :shortcuts="['Meta', actionKey]" v-else-if="actionKey" @click="$emit('enter')"></ShortcutsKey>
    </div>
  </div>
</template>

<script setup lang="ts">
import ShortcutsKey from '@/components/ShortcutsKey.vue';
interface IResultItem {
  icon?: string,
  title: string,
  subtitle?: string,
}

interface IResultItemProps extends IResultItem {
  index?: number,
  selected?: boolean,
  actionKey?: string,
}

defineProps<IResultItemProps>()

defineEmits<{
  select: [],
  enter: []
}>()

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
  padding: 0 16px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  :deep(mark) {
    background: none;
    color: rgb(251, 163, 0);
  }
}
.resultItem:hover {
  background-color: light-dark(rgba(0, 0, 0, 0.1), rgba(184, 184, 184, 0.2));
}
.resultItem.selected {
  background-color: light-dark(rgba(0, 0, 0, 0.15), rgba(184, 184, 184, 0.3));
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
  opacity: 0.7;
  height: 16px;
  white-space: pre;
  font-size: 500;
}
.actions {
  display: flex;
  align-items: center;
}
</style>