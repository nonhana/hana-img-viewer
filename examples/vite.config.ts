import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
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
