<script lang="ts">
	import MainView from './components/MainView.svelte'
</script>


<MainView />

<style>
  :global(body) {
    background: #fff;
  }
	@media (prefers-color-scheme: dark) {
    :global(html) {
      filter: invert(1) hue-rotate(180deg);
      background: #fff;
    }
  }


  :global(webview) {
    display: none;
  }
  :global(webview.show) {
    width: 100%;
    height: 480px;
    display: flex;
  }
</style>