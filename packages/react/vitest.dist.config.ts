import { defineConfig, mergeConfig } from 'vitest/config'

import sharedConfig from './vitest.shared.ts'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'dist',
      environment: 'node',
      include: ['tests/dist-contract/**/*.test.ts'],
    },
  }),
)
