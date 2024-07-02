<template>
  <span class="material-symbols-outlined loading-icon">progress_activity</span>
</template>

<style lang="scss" scoped>
.loading-icon {
  animation: rotation ease-in 2s infinite both;
}

@keyframes rotation {
  from {
    transform: rotate(0)
  }
  to {
    transform: rotate(360deg)
  }
}
</style>