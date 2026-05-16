import { defineConfig, mergeConfig } from './scripts/vitest-config.mjs'
import sharedConfig from './vitest.shared'

export default mergeConfig(sharedConfig, defineConfig({
  test: {
    name: 'dist',
    environment: 'node',
    include: ['tests/dist-contract/**/*.test.ts'],
  },
}))
