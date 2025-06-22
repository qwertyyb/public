<template>
  <section class="plugin-view">
    <header class="plugin-view-header">
      <div class="navBack material-symbols-outlined cursor-pointer"
        @pointerdown="$router.back()">
        arrow_back
      </div>
    </header>
    <main class="plugin-view-main">
      <webview :src="entryUrl"
        class="plugin-view-webview"
        partition="plugin"
        webpreferences="contextIsolation=no, sandbox=no"
        :preload="preload"
      ></webview>
    </main>
  </section>
</template>

<script setup lang="ts">
import { pluginViewState as state } from '@/state/plugin';
import { computed, onBeforeUnmount, onMounted, type WebViewHTMLAttributes } from 'vue';
import { useRouter } from 'vue-router';

const entryUrl = computed(() => {
  let url: URL
  if (state.value?.command.mode === 'listView') {
    url = new URL(location.href)
    url.hash = '#/plugin/list-view'
  } else {
    url = new URL(state?.value?.command.entry || '', location.href);
  }
  url.searchParams.set('command', state.value?.command.name || '');
  url.searchParams.set('query', state.value?.command.query || '');
  return url.toString();
})

const preload = computed(() => {
  const origin = state.value?.command.preload
  if (!origin) return origin
  return origin.startsWith('file://') ? origin : `file://${origin}`
})

const getWebview = () => document.querySelector('.plugin-view-webview') as any

const router = useRouter()

const messageHandler = (event: any) => {
  console.log('messageHandlder', event)
  const { channel } = event
  if (channel === 'exitCommand') {
    router.back()
  }
}

onMounted(() => {
  const webview = getWebview()
  console.log(webview)
  webview.focus()
  webview.addEventListener('ipc-message', messageHandler)
})

onBeforeUnmount(() => {
  const webview = getWebview()
  webview.blur()
  webview.removeEventListener('ipc-message', messageHandler)
})
</script>

<style lang="scss" scoped>
.plugin-view-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: absolute;
  top: 0;
  left: 0;
}
.plugin-view-main {
  height: 100vh;
}
.plugin-view-webview {
  height: 100%;
}
</style>