<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { useNavigate } from 'svelte-navigator';
  import ResultView from './ResultView.svelte'
  import PluginLabel from './PluginLabel.svelte'
  import PluginView from '../pages/PluginView.svelte';

  import InputBar from './InputBar.svelte'

  let keyword: string = '';
  let curPlugin: Config = null;
  let curCommand: Command = null;
  let preload: string = null;
  let resultList = [];

  const navigate = useNavigate();

  const clearAndFocusInput = () => {
    const el = document.querySelector('.input-bar input') as HTMLInputElement
    el && (el.value = '')
    el && el.focus()
    onInputChange('');
    setTimeout(() => {
      el.focus()
    }, 200)
  }
  // @ts-ignore
  window.clearAndFocusInput = clearAndFocusInput

  const onInputChange = (value: string | Event) => {
    if (curPlugin && curCommand && typeof value !== 'string') {
      keyword = (value.target as HTMLInputElement).value || ''
      console.log('[MainView]onInputChange', keyword)
    } else {
      const str = typeof value === 'string' ? value : (value.target as HTMLInputElement).value
      window.PluginManager.handleQuery(str)
    }
  }

  // @ts-ignore
  window.setQuery = (value: string) => {
    const el = document.querySelector('.input-bar input')
    // @ts-ignore
    el && (el.value = value)
    // @ts-ignore
    el && (el.focus())
    onInputChange(value)
  }

  const setPluginResults = (e: CustomEvent) => {
    const { resultList: nextResultList, append = false } = e.detail || {}
    if (append) {
      resultList = [...resultList, ...nextResultList]
    } else {
      resultList = nextResultList;
    }
  }

  const onResultEnter = (item) => {
    if (!item) return;
    
    const targetPlugin = item.configPath;

    clearAndFocusInput()
    window.PluginManager.handleEnter(targetPlugin, item)
  }

  const enterPlugin = (e: CustomEvent<{ plugin: Config, command: Command, preload: string }>) => {
    const { plugin, command, preload: preloadPath } = e.detail || {}
    curPlugin = plugin
    curCommand = command
    preload = preloadPath
    // navigate('/plugin')
  }

  const exitPlugin = () => {
    curPlugin = null
  }

  onMount(() => {
    document.addEventListener('plugin:enter', enterPlugin);
    document.addEventListener('plugin:setList', setPluginResults);
    document.addEventListener('plugin:exit', exitPlugin)
  })

  onDestroy(() => {
    document.removeEventListener('plugin:enter', enterPlugin);
    document.removeEventListener('plugin:setList', setPluginResults);
    document.removeEventListener('plugin:exit', exitPlugin);
  })
</script>

<main>
  <PluginLabel plugin={curPlugin}></PluginLabel>
  <div class="input-list-container">
    {#if !curPlugin}
    <InputBar showBack={!!curPlugin}
      on:input={onInputChange}
      on:back={exitPlugin} />
    {/if}
    {#if curPlugin}
      <PluginView
        keyword={keyword}
        plugin={curPlugin}
        preload={preload}
        command={curCommand}></PluginView>
    {:else}
    <ResultView resultList={resultList}
      onResultEnter={onResultEnter}></ResultView>
    {/if}
  </div>
</main>

<style>
  main {
    backdrop-filter: blur(20px);
    max-width: 780px;
  }
  .input-list-container {
    background: #fff;
    height: 480px;
  }
  @media screen and (max-height: 60px) {
    * {
      overflow: hidden;
    }
  }
</style>