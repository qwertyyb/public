<script lang="ts">
  export let plugin = null;
</script>

<div class="plugin-label-container">
  {#if plugin}
  <div class="plugin-label">
    <img src={plugin.icon} alt="" class="plugin-icon">
    <div class="plugin-title">{plugin.title}</div>
  </div>
  {/if}
</div>

<style>
  .plugin-label-container {
    height: 32px;
  }
  .plugin-label {
    background: #fff;
    color: #333;
    display: flex;
    align-items: center;
    width: fit-content;
    padding: 1px 6px;
    margin-bottom: 6px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
  }
  .plugin-icon {
    width: 24px;
    height: 24px;
    margin-right: 6px;
  }
  .plugin-title {
    font-size: 14px;
  }
</style>