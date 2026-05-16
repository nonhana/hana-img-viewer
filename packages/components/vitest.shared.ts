import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { resolvePnpmPackageRoot } from './scripts/pnpm-store.mjs'
import { defineConfig } from './scripts/vitest-config.mjs'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          comments: false,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@vue/server-renderer': resolvePnpmPackageRoot('@vue/server-renderer'),
      '@vue/test-utils': resolvePnpmPackageRoot('@vue/test-utils'),
    },
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
  },
})
