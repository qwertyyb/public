<template>
  <section class="resultItemPreview">
    <div class="previewWrapper" ref="previewEl"></div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  html: string | HTMLElement
}>()

const previewEl = ref<HTMLDivElement>()

const renderPreview = () => {
  if (!previewEl.value) return
  if (typeof props.html === 'string') {
    previewEl.value.innerHTML = props.html
  } else {
    previewEl.value.innerHTML = ''
    previewEl.value.appendChild(props.html)
  }
}

watch(() => props.html, renderPreview)

onMounted(() => {
  renderPreview()
})

</script>

<style lang="scss" scoped>
.resultItemPreview {
  box-sizing: border-box;
  flex: 4;
  border-left: 1px solid light-dark(#c0c0c0, #333);
  height: 486px;
  min-height: 486px;
  max-width: 64%;
  overflow: auto;
}
.previewWrapper {
  --preview-height: 462px;
  padding: 12px;
  box-sizing: border-box;
  min-height: 100%;
}
</style>