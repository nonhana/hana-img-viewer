import { resolve } from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from './vitest.shared.ts'

export default mergeConfig(sharedConfig, defineConfig({
  test: {
    name: 'component',
    environment: 'jsdom',
    include: ['tests/component/**/*.test.ts'],
    setupFiles: [resolve(import.meta.dirname, 'tests/setup/component.setup.ts')],
  },
}))
