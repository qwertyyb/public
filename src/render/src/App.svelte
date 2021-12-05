<script lang="ts">
  import { Router, Route } from "svelte-navigator";
	import MainView from './components/MainView.svelte'
  import PluginView from './pages/PluginView.svelte';
</script>


<Router>
  <Route path="/">
    <MainView />
  </Route>
  
  <Route path="/plugin">
    <PluginView />
  </Route>
</Router>

<style>
	@media (prefers-color-scheme: dark) {
    :global(html) {
      filter: invert(1) hue-rotate(180deg);
      background: #fff;
    }
  }
</style>