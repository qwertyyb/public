<div class="result-item"
  class:selected="{selected}"
  on:mouseenter
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
  height: 60px;
  max-width: 100%;
  content-visibility: auto;
  contains-intrinsic-size: 60px;
}
.result-item.selected {
  background: rgb(64, 102, 226);
}
.result-item.selected .item-title,
.result-item.selected .item-subtitle {
  color: #fff;
}
.item-image-wrapper {
  width: 60px;
  height: 48px;
  margin-right: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}
.item-image-wrapper img {
  width: 42px;
  height: 42px;
}
.item-info {
  max-width: calc(100% - 80px);
}
.item-title {
  font-size: 16px;
  font-weight: normal;
  height: 24px;
}
.item-subtitle {
  font-size: 12px;
  font-weight: normal;
  opacity: 0.6;
  height: 16px;
  white-space: pre;
}
</style>