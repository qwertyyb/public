// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///Users/marchyang/mine/public/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.1_sass-embedded@1.89.2_terser@5.43.1/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/marchyang/mine/public/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@5.4.19_@types+node@20.19.1_sass-embedded@1.89.2_terser@5._4a73210f9b8ad02c451d566707906d27/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/marchyang/mine/public/node_modules/.pnpm/@vitejs+plugin-vue-jsx@4.2.0_vite@5.4.19_@types+node@20.19.1_sass-embedded@1.89.2_terse_7705cb87ee832355c3da5d7111725905/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import ElementPlus from "file:///Users/marchyang/mine/public/node_modules/.pnpm/unplugin-element-plus@0.8.0_rollup@4.44.1/node_modules/unplugin-element-plus/dist/vite.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/marchyang/mine/public/packages/render/vite.config.ts";
var vite_config_default = defineConfig({
  base: "./",
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "webview"
        }
      }
    }),
    vueJsx(),
    ElementPlus({
      // options
    })
  ],
  server: {
    port: 4e3
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWFyY2h5YW5nL21pbmUvcHVibGljL3BhY2thZ2VzL3JlbmRlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL21hcmNoeWFuZy9taW5lL3B1YmxpYy9wYWNrYWdlcy9yZW5kZXIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL21hcmNoeWFuZy9taW5lL3B1YmxpYy9wYWNrYWdlcy9yZW5kZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcblxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xuaW1wb3J0IEVsZW1lbnRQbHVzIGZyb20gJ3VucGx1Z2luLWVsZW1lbnQtcGx1cy92aXRlJ1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogJy4vJyxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSh7XG4gICAgICB0ZW1wbGF0ZToge1xuICAgICAgICBjb21waWxlck9wdGlvbnM6IHtcbiAgICAgICAgICBpc0N1c3RvbUVsZW1lbnQ6ICh0YWcpID0+IHRhZyA9PT0gJ3dlYnZpZXcnXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSxcbiAgICB2dWVKc3goKSxcbiAgICBFbGVtZW50UGx1cyh7XG4gICAgICAvLyBvcHRpb25zXG4gICAgfSksXG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDQwMDBcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1QsU0FBUyxlQUFlLFdBQVc7QUFFelYsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGlCQUFpQjtBQUx3SyxJQUFNLDJDQUEyQztBQVFqUCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixVQUFVO0FBQUEsUUFDUixpQkFBaUI7QUFBQSxVQUNmLGlCQUFpQixDQUFDLFFBQVEsUUFBUTtBQUFBLFFBQ3BDO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsT0FBTztBQUFBLElBQ1AsWUFBWTtBQUFBO0FBQUEsSUFFWixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
