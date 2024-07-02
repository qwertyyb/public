<template>
  <div class="virtual-list" ref="listWrapper">
    <div
      class="virtual-list__inner"
      :style="{
        'paddingTop': `${startOffset}px`,
        'minHeight': `${totalHeight}px`,
      }"
    >
      <div class="virtual-list-item" v-for="(item, index) in visibleList" :key="index">
        <slot :item="item" :index="index + start"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  itemHeight: number,
  list: any[],
  keeps: number,
}>(), {
  itemHeight: 54,
  keeps: 30,
  list: () => []
})

const listWrapper = ref<HTMLElement>()

const startOffset = ref(0)

const totalHeight = computed(() => props.itemHeight * props.list.length)

const start = computed(() => startOffset.value / props.itemHeight)

const visibleList = computed(() => props.list.slice(start.value, start.value + props.keeps))

watch(() => props.list, () => {
  startOffset.value = 0
})

const scrollHandler = () => {
  const prevCount = 10;
  const scrollTop = listWrapper.value?.scrollTop ?? 0;

  let newStartOffset = Math.max(scrollTop - props.itemHeight * prevCount, 0);
  newStartOffset = Math.min(Math.max(0, totalHeight.value - props.itemHeight * props.keeps), newStartOffset);

  startOffset.value = newStartOffset
};

onMounted(() => {
  listWrapper.value?.addEventListener('scroll', scrollHandler)
})

onBeforeUnmount(() => {
  listWrapper.value?.removeEventListener('scroll', scrollHandler)
})
</script>

<style lang="scss" scoped>
.virtual-list {
  overflow: auto;
  max-height: calc(54px * 9);
}
.virtual-list-inner {
  box-sizing: border-box;
}
</style>