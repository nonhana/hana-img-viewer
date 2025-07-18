import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      'hana-img-viewer': resolve(__dirname, '../packages/components/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['hana-img-viewer'],
    force: true,
  },
  server: {
    hmr: {
      overlay: true,
    },
  },
})
