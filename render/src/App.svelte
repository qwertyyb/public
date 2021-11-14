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
</style>