import { defineConfig, mergeConfig } from './scripts/vitest-config.mjs'
import sharedConfig from './vitest.shared'

export default mergeConfig(sharedConfig, defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
}))
