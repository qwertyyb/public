<script lang="ts">
  import { onDestroy } from "svelte";

  export let plugin: Config = null;
  export let command: Command = null;
  export let keyword: string = '';
  export let preload: string = '';

  let webviewUrl: string = '';
  let webview: HTMLElement | null = null;
  let timeout = null;

  $: {
    webview?.addEventListener('dom-ready', () => {
      console.log('ready')
    })
  }

  $: {
    timeout && clearTimeout(timeout)
    timeout = setTimeout(() => {
      console.log('[PluginView]onInput', keyword)
      const code = `window.plugin?.onInput?.(${JSON.stringify(keyword)})`;
      try {
        (webview as Electron.WebviewTag)?.executeJavaScript(code);
      } catch(err) {
        console.log('err')
      }
    }, 200)
  }

  $: {
    if (command.mode === 'list-preview') {
      webviewUrl = `./index.html?plugin=1&entry=${encodeURIComponent(command.entry)}`
    } else {
      webviewUrl = command.entry
    }
  }
  
  $: if (webview) {
    webview.addEventListener('dom-ready', () => {
      webview.focus()
    })
    const { handler } = window.PluginManager.getPlugin(plugin.name);
    (webview as Electron.WebviewTag).addEventListener('ipc-message', handler)
  }

  onDestroy(() => {
    const { handler } = window.PluginManager.getPlugin(plugin.name);
    (webview as Electron.WebviewTag).removeEventListener('ipc-message', handler)
  })
</script>

<div class="plugin-view">
  {#if plugin}
  <webview src={webviewUrl} bind:this={webview} preload={preload}></webview>
  {/if}
</div>

<style>
  webview {
    width: 100%;
    height: 480px;
    display: flex;
  }
</style>