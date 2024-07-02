<template>
  <div class="loadingBar">
    <div class="loadingBarInner"></div>
  </div>
</template>

<style lang="scss" scoped>
.loadingBar {
  width: 100%;
  height: 1px;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.loadingBarInner {
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, #838383, transparent);
  position: absolute;
  top: 0;
  left: -100%;
  animation: loading 2s infinite;
}

@keyframes loading {
  0% {
      left: -50%;
  }
  50% {
      left: 50%;
  }
  100% {
      left: -50%;
  }
}
</style>