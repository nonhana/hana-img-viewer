import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from './vitest.shared.ts'

export default mergeConfig(sharedConfig, defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
}))
