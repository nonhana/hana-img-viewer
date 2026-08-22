import { defineConfig, mergeConfig } from './scripts/vitest-config.mjs'
import sharedConfig from './vitest.shared'

export default mergeConfig(sharedConfig, defineConfig({
  test: {
    name: 'ssr',
    environment: 'node',
    include: ['tests/ssr/**/*.test.ts'],
  },
}))
