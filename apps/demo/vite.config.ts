import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { discoverDemoEntries } from './scripts/entries.mjs'

const demoEntries = discoverDemoEntries(import.meta.dirname)

export default defineConfig({
  plugins: [
    vue(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      'hana-img-viewer-react/style.css': resolve(
        import.meta.dirname,
        '../../packages/react/src/style.css',
      ),
      'hana-img-viewer-react': resolve(
        import.meta.dirname,
        '../../packages/react/src/index.ts',
      ),
      'hana-img-viewer': resolve(import.meta.dirname, '../../packages/vue/src/index.ts'),
      '@': resolve(import.meta.dirname, '../../packages/react/src'),
    },
  },
  optimizeDeps: {
    exclude: ['hana-img-viewer', 'hana-img-viewer-react'],
    force: true,
  },
  build: {
    rollupOptions: {
      input: demoEntries.clientInputs,
    },
  },
  server: {
    host: '127.0.0.1',
    hmr: {
      overlay: true,
    },
  },
})
