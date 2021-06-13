<script lang="ts">
	import MainView from './components/MainView.svelte'
</script>


<MainView />

<style>
	@media (prefers-color-scheme: dark) {
    :global(html) {
      filter: invert(1) hue-rotate(180deg);
    }
  }
</style>