<script setup lang="ts">
import AIChatView from '@/views/AIChatView.vue'
import HomeView from '@/views/HomeView.vue'
import ListView from '@/views/ListView.vue'
import PluginPrfsView from '@/views/PluginPrfsView.vue'
import PluginView from '@/views/PluginView.vue'
import SettingsView from '@/views/SettingsView.vue'
import RoutePage from '@/components/RoutePage.vue'
import { nextTick, onBeforeUnmount, shallowRef, useTemplateRef, type Component } from 'vue'

const hash = location.hash.substring(1)

const routes: Record<string, Component | undefined> = {
  '/': HomeView,
  '/ai/chat': AIChatView,
  '/plugin/list-view': ListView,
  '/plugin/view': PluginView,
  '/plugin/prfs': PluginPrfsView,
  '/settings': SettingsView,
}

const pages = useTemplateRef('page')

const history = shallowRef<{
  component: Component,
  props?: any,
}[]>([
  { component: routes[hash] || HomeView }
])

const toPluginView = (e: any) => {
  console.log('toPluginView', e)
  pluginViewState.value = { ...e.detail }
  history.value = [ ...history.value, { component: PluginView }]
}

const pushView = async (options: { path: string, params?: any }) => {
  const { path, params } = options
  console.log(options)
  const component = routes[path]
  if (component) {
    history.value = [ ...history.value, { component, props: params }]
    await nextTick()
    pages.value?.[history.value.length - 2]?.dispatchLeave()
  }
}

const popView = async (options?: { count?: number }) => {
  const count = options?.count || 1
  history.value = [...history.value.slice(0, Math.max(1, history.value.length - count))]
  await nextTick()
  pages.value?.[history.value.length - 1]?.dispatchEnter()
}


const pushViewHandler = (e: any) => pushView(e.detail)
const popViewHandler = (e: any) => popView(e.detail)
const popToRootHandler = () => {
  popView({ count: history.value.length - 1 })
}

window.addEventListener('create-view', toPluginView)
window.addEventListener('push-view', pushViewHandler)
window.addEventListener('pop-view', popViewHandler)
window.addEventListener('pop-to-root', popToRootHandler)

onBeforeUnmount(() => {
  window.removeEventListener('create-view', toPluginView)
  window.removeEventListener('push-view', pushViewHandler)
  window.removeEventListener('pop-view', popViewHandler)
  window.removeEventListener('pop-to-root', popToRootHandler)
})

</script>

<template>
  <div class="app">
    <header class="app-header" v-if="history.length > 1">
      <div class="navBack material-symbols-outlined cursor-pointer"
        @pointerdown="popView()">
        arrow_back
      </div>
    </header>
    <ul class="history-list">
      <route-page class="history-item"
        v-for="(item, index) in history"
        :key="index"
        ref="page"
      >
        <component :is="item.component" v-bind="item.props"></component>
      </route-page>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.app-header {
  height: 48px;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
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

.cursor-pointer {
  cursor: pointer;
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
