import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import ElementPlus from 'unplugin-element-plus/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    }),
    vueJsx(),
    ElementPlus({
      // options
    })
  ],
  server: {
    port: 4000
  },
  // build: {
  //   rollupOptions: {
  //     external: ['vue', 'vue-router', 'element-plus'],
  //     output: {
  //       format: 'iife',
  //       name: 'MyBundle',
  //       globals: {
  //         vue: 'Vue',
  //         'vue-router': 'VueRouter',
  //         'element-plus': 'ElementPlus'
  //       }
  //     }
  //   }
  // },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
