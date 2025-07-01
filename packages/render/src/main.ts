import { createApp } from 'vue'
import VirtualList from 'vue-virtual-list-v3';
import App from './App.vue'
import router from './router'
import './style.css'

import './web-components/markdown-render'

const app = createApp(App)

app.use(router)
app.use(VirtualList)

app.mount('#app')
