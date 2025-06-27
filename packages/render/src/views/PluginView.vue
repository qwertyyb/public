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
import type { ICommandMatchData, IPluginCommand, IRunningPlugin, IWebview, IWebviewTagAttributes } from '@public/shared';
import type { createBridge } from '@public/utils';
import { computed, onBeforeUnmount, onMounted } from 'vue';

const props = defineProps<{
  plugin: IRunningPlugin,
  command: IPluginCommand,
  match: ICommandMatchData
} | {
  options?: IWebviewTagAttributes,
  plugin: IRunningPlugin,
  callback: (options: { webview: IWebview, bridge: ReturnType<typeof createBridge> }) => void
}>()

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
  if ('options' in props && props.options) {
    return props.options
  }
  return {
    src: getEntryUrl((props as any).command),
    preload: getPreload((props as any).command),
    partition: "plugin",
    webpreferences: "contextIsolation=no, sandbox=no"
  }
})

console.log(webviewProps)

const getWebview = () => document.querySelector<IWebview>('webview.plugin-view-webview')

const messageHandler = (event: any) => {
  console.log('messageHandlder', event)
  const { channel } = event
  if (channel === 'exitCommand') {
    window.publicApp.mainWindow.popToRoot()
  }
}

let bridge: ReturnType<typeof createBridge>

onMounted(() => {
  const webview = getWebview()
  bridge = createBridge(
    (payload) => getWebview()?.send('bridgeMessage', payload),
    (callback) => getWebview()?.addEventListener('ipc-message', (event) => {
      if (event.channel === 'bridgeMessage') {
        callback(event.args[0])
      }
    })
  )
  if (webview && ('callback' in props) && typeof props.callback === 'function') {
    props.callback({ webview, bridge })
  }
  webview?.focus()
  webview?.addEventListener('ipc-message', messageHandler)

  const innerBridge = createBridge(
    (payload) => getWebview()?.send('innerBridgeMessage', payload),
    (callback) => getWebview()?.addEventListener('ipc-message', (event) => {
      if (event.channel === 'innerBridgeMessage') {
        callback(event.args[0])
      }
    })
  )
  innerBridge.handle('popToRoot', (options) => window.publicApp.mainWindow.popToRoot(options))
  innerBridge.handle('getPreferenceValues', (commandName?: string) => {
    return window.publicApp.plugin.getPreferenceValues(props.plugin.manifest.name, commandName)
  })
  innerBridge.handle('openPreferences', (commandName?: string) => {
    return window.publicApp.plugin.openPreferences(props.plugin.manifest.name, commandName)
  })
  innerBridge.handle('getLaunchData', () => {
    if ('match' in props){
      return props.match
    }
    return
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