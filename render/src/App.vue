<script setup lang="ts">
import { pluginViewState } from '@/state/plugin'
import AIChatView from '@/views/AIChatView.vue'
import HomeView from '@/views/HomeView.vue'
import ListView from '@/views/ListView.vue'
import PluginPrfsView from '@/views/PluginPrfsView.vue'
import PluginView from '@/views/PluginView.vue'
import SettingsView from '@/views/SettingsView.vue'
import { onBeforeUnmount, shallowRef, type Component } from 'vue'

const hash = location.hash.substring(1)

const routes: Record<string, Component | undefined> = {
  '/': HomeView,
  '/ai/chat': AIChatView,
  '/plugin/list-view': ListView,
  '/plugin/view': PluginView,
  '/plugin/prfs': PluginPrfsView,
  '/settings': SettingsView,
}

const history = shallowRef<{
  component: Component,
  props?: any,
}[]>([
  { component: routes[hash] || HomeView }
])

const routePop = () => {
  history.value = [...history.value.slice(0, history.value.length - 1)]
}

const toPluginView = (e: any) => {
  console.log('toPluginView', e)
  pluginViewState.value = { ...e.detail }
  history.value = [ ...history.value, { component: PluginView }]
}

const toPrfsView = (e: any) => {
  history.value = [ ...history.value, { component: PluginPrfsView, props: { ...e.detail } }]
}

window.addEventListener('enter-plugin-command', toPluginView)
window.addEventListener('create-view', toPluginView)
window.addEventListener('open-prfs-view', toPrfsView)

onBeforeUnmount(() => {
  window.removeEventListener('enter-plugin-command', toPluginView)
  window.removeEventListener('create-view', toPluginView)
  window.removeEventListener('open-prfs-view', toPrfsView)
})

</script>

<template>
  <div class="app">
    <header class="app-header" v-if="history.length > 1">
      <div class="navBack material-symbols-outlined cursor-pointer"
        @pointerdown="routePop">
        arrow_back
      </div>
    </header>
    <ul class="history-list">
      <li class="history-item"
        v-for="(item, index) in history"
        :key="index"
      >
        <component :is="item.component" v-bind="item.props"></component>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.app-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: absolute;
  top: 0;
  left: 0;
}
.history-list {
  .history-item:not(:last-child) {
    display: none;
  }
}
</style>

<style>
:root {
  color-scheme: light dark;
}
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* background-color: blue; */
  background-repeat: no-repeat;
  background-size: cover;
}


code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

body {
	margin: 0;
	box-sizing: border-box;
}

*:not(dialog) {
	padding: 0;
	margin: 0;
  outline: none;
}

.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}
.items-center {
  align-items: center;
}
.items-stretch {
  align-items: stretch;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.flex-1 {
  flex: 1;
}

.text-single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
::-webkit-scrollbar {
  width: 0;
}

/* @media (prefers-color-scheme: dark) {
  body {
    background: #000;
    color: #fff;
  }
} */


dialog::backdrop {
  background: rgba(0, 0, 0, .85);
}
dialog {
  border-radius: 6px;
  background-color: light-dark(#f4f4f4, #373737);
  border-color: light-dark(#ececec, #464646);
}
</style>
