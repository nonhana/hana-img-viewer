import { defineConfig, mergeConfig } from 'vitest/config'

import sharedConfig from './vitest.shared.ts'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'ssr',
      environment: 'node',
      include: ['tests/ssr/**/*.test.{ts,tsx}'],
    },
  }),
)
