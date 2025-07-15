import { createApp } from 'vue'
import VirtualList from 'vue-virtual-list-v3';
import './utils/darkmode';
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import './style.css'

import './web-components/markdown-render'

const app = createApp(App)

app.use(VirtualList)

app.mount('#app')
