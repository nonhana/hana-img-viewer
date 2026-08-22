import { defineConfig, mergeConfig } from 'vitest/config'

import sharedConfig from './vitest.shared.ts'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'component',
      environment: 'jsdom',
      globals: true,
      include: ['tests/component/**/*.test.{ts,tsx}'],
      setupFiles: ['tests/setup/component.setup.ts'],
    },
  }),
)
