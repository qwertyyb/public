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
    <ul class="action-list" ref="floatingEl"
      v-if="selected && actionsVisible && (actions?.length || 1) > 1"
      :style="floatingStyles">
      <div
        class="floating-arrow"
        ref="floatingArrowEl"
        :style="{
          position: 'absolute',
          left:
            middlewareData.arrow?.x != null
              ? `${middlewareData.arrow.x}px`
              : '',
          top:
            middlewareData.arrow?.y != null
              ? `${middlewareData.arrow.y}px`
              : '',
        }"
      ></div>
      <li class="action-item" v-for="(action, index) in actions" :key="index">
        <div class="material-symbols-outlined action-icon">{{ action.icon }}</div>
        <div class="action-title">{{ action.title }}</div>
        <ShortcutsKey :shortcuts="action.shortcuts" v-if="action.shortcuts"></ShortcutsKey>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import ShortcutsKey from '@/components/ShortcutsKey.vue';
import { computed, ref } from 'vue';
import { useFloating, offset, shift, flip, arrow } from '@floating-ui/vue';

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

const props = defineProps<IResultItemProps>()

defineEmits<{
  select: [],
  enter: []
}>()

const moreEl = ref<HTMLElement>()
const floatingEl = ref<HTMLElement>()
const floatingArrowEl = ref<HTMLElement>()

const actionsVisible = computed(() => props.actionsVisible)
 
const { floatingStyles, middlewareData } = useFloating(moreEl, floatingEl, {
  open: actionsVisible,
  placement: 'top',
  middleware: [offset({ mainAxis: -24, crossAxis: 20 }), shift(), flip(), arrow({ element: floatingArrowEl })]
});
</script>

<style lang="scss" scoped>
.resultItem {
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  height: 54px;
  max-width: 100%;
  // content-visibility: auto;
  // contains-intrinsic-size: 54px;
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

.action-list {
  --bg-color: #d1d1d1;
  background: var(--bg-color);
  box-shadow: 0 7px 14px rgb(156, 156, 156);
  border-radius: 4px;
  display: flex;
  z-index: 2;
  flex-direction: column;
  .floating-arrow {
    display: block;
    border-top: 10px solid transparent;
    border-left: none;
    border-right: 12px solid var(--bg-color);
    border-bottom: 10px solid transparent;
    left: -8px;
    top: 0;
    position: absolute;
  }
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
  padding-right: 36px;
}
</style>