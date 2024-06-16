<script lang="ts">
	import MainView from './components/MainView.svelte'
</script>

<div id="app">
  <MainView />
</div>

<style>
  :global(body) {
    background: #ddd;
  }
  #app {
    backdrop-filter: blur(6px);
  }
	@media (prefers-color-scheme: dark) {
    :global(html) {
      filter: invert(1) hue-rotate(180deg);
      background: #fff;
    }
  }
</style>