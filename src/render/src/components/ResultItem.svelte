<div class="result-item"
  class:selected="{selected}"
  on:click={onEnter}>
  <div class="item-image-wrapper flex-h-v">
    <img src={icon} alt=""/>
  </div>
  <div class="item-info flex-1 flex-col-center">
    <h3 class="item-title text-single-line">{title}</h3>
    <h5 class="item-subtitle color-666 text-sm text-single-line">{subtitle}</h5>
  </div>
</div>

<script lang="ts">
  export let icon: string;
  export let title: string;
  export let subtitle: string;
  export let selected: boolean = false;
  export let onEnter: (event: Event) => void;
</script>

<style>
.result-item {
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  height: 48px;
  max-width: 100%;
  content-visibility: auto;
  contains-intrinsic-size: 48px;
}
.result-item:hover {
  background: #eee;
}
.result-item.selected {
  background: #ddd;
}

.item-image-wrapper {
  width: 48px;
  height: 48px;
  margin-right: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
}
.item-image-wrapper img {
  width: 32px;
  height: 32px;
}
.item-info {
  max-width: calc(100% - 80px);
}
.item-title {
  font-size: 12px;
  font-weight: bold;
  height: 18px;
}
.item-subtitle {
  font-size: 10px;
  font-weight: normal;
  opacity: 0.6;
  height: 16px;
  white-space: pre;
}
</style>