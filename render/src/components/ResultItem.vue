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
    <div class="shortcutList">
      <div class="shortcutItem" v-if="selected">↵</div>
      <template v-if="!selected && actionKey">
        <div class="shortcutItem">⌘</div>
        <div class="shortcutItem">{{ actionKey }}</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  index?: number,
  icon?: string,
  title: string,
  subtitle?: string,
  selected?: boolean,
  actionKey?: string
}>()

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
  contains-intrinsic-size: 54px;
  transition: all .1s;
  padding: 0 12px;
  box-sizing: border-box;
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
.actionIcon {
  font-size: 16px;
  color: #ccc;
}
.shortcutList {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  margin-left: 12px;
}
.shortcutItem {
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