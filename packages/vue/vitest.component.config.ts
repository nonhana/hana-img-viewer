import { resolve } from 'node:path'
import { defineConfig, mergeConfig } from './scripts/vitest-config.mjs'
import sharedConfig from './vitest.shared'

export default mergeConfig(sharedConfig, defineConfig({
  test: {
    name: 'component',
    environment: 'jsdom',
    include: ['tests/component/**/*.test.ts'],
    setupFiles: [resolve(__dirname, 'tests/setup/component.setup.ts')],
  },
}))
