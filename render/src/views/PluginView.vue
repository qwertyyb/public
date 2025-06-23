<template>
  <section class="plugin-view">
    <main class="plugin-view-main">
      <webview
        class="plugin-view-webview"
        partition="plugin"
        v-bind="webviewProps"
      ></webview>
    </main>
  </section>
</template>

<script setup lang="ts">
import { pluginViewState as state } from '@/state/plugin';
import type { IPluginCommand, IWebviewElement } from '@public/shared';
import { pick } from 'ramda';
import { computed, onBeforeUnmount, onMounted, type WebViewHTMLAttributes } from 'vue';
import { useRouter } from 'vue-router';

const getEntryUrl = (command: IPluginCommand) => {
  let url: URL
  if (command.mode === 'listView') {
    url = new URL(location.href)
    url.hash = '#/plugin/list-view'
  } else {
    url = new URL(command.entry || '', location.href);
  }
  url.searchParams.set('command', command.name || '');
  url.searchParams.set('query', command.query || '');
  return url.toString();
}

const getPreload = (command: IPluginCommand) => {
  if (!command.preload) return;
  const origin = command.preload
  if (!origin) return origin
  return origin.startsWith('file://') ? origin : `file://${origin}`
}


const webviewProps = computed(() => {
  if (!state.value) return {}
  if ('callback' in state.value) {
    return state.value.options
  }
  return {
    src: getEntryUrl(state.value.command),
    preload: getPreload(state.value.command),
    partition: "plugin",
    webpreferences: "contextIsolation=no, sandbox=no, additionalArguments=['aaaabbbccc']"
  }
})

const getWebview = () => document.querySelector<IWebviewElement>('webview.plugin-view-webview')

const router = useRouter()

const messageHandler = (event: any) => {
  console.log('messageHandlder', event)
  const { channel } = event
  if (channel === 'initMeta') {
    if (!state.value || 'callback' in state.value) return
    console.log('receive initMeta')
    // getWebview()?.send('meta', {
    //   plugin: pick(['name', 'title', 'icon'], state.value.plugin.manifest),
    //   command: pick(['name', 'title', 'icon'], state.value.command),
    //   pluginPreferences: state.value.plugin.settings?.preferences || {},
    //   commandPreferences: state.value.plugin.settings?.commands?.[state.value.command.name]?.preferences || {}
    // })
    getWebview()?.executeJavaScript(`console.log('execsssss', performance.now())`)
    return;
  }
  if (channel === 'exitCommand') {
    router.back()
  }
}

onMounted(() => {
  const webview = getWebview()
  if (webview && state.value && 'callback' in state.value) {
    state.value.callback(webview)
  }
  webview?.focus()
  webview?.addEventListener('ipc-message', messageHandler)
  webview?.addEventListener('dom-ready', () => {
    console.log('dddd dom ready')
    webview?.executeJavaScript(`console.log('aaabbbccc', performance.now());window.weeapp='hello'`)
  })
})

onBeforeUnmount(() => {
  const webview = getWebview()
  webview?.blur()
  webview?.removeEventListener('ipc-message', messageHandler)
})
</script>

<style lang="scss" scoped>
.plugin-view-main {
  height: 100vh;
}
.plugin-view-webview {
  height: 100%;
}
</style>