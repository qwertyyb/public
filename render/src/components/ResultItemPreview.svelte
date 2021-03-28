<section class="result-item-preview">
  <div class="preview-wrapper">
    <slot></slot>
  </div>
</section>

<style>
  .result-item-preview {
    box-sizing: border-box;
    flex: 4;
    border-left: 1px solid #ddd;
    min-height: 540px;
    height: 540px;
    max-width: 50%;
    overflow: hidden;
  }
  .preview-wrapper {
    padding: 20px;
  }
</style>