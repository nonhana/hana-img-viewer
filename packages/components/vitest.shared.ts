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
      '@vueuse/core': resolvePnpmPackageRoot('@vueuse/core'),
      '@vueuse/shared': resolvePnpmPackageRoot('@vueuse/shared'),
    },
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
  },
})
