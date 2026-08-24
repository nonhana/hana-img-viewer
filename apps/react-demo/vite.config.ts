import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
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
      '@': resolve(
        import.meta.dirname,
        '../../packages/react/src',
      ),
    },
  },
  server: {
    host: '127.0.0.1',
    hmr: {
      overlay: true,
    },
  },
})
