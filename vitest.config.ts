import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const root = import.meta.dirname

const environmentSetup = resolve(root, 'tests/environment/dom.setup.ts')

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: {
          alias: {
            '@': resolve(root, 'packages/react/src'),
          },
        },
        test: {
          name: 'contract-react-dom',
          environment: 'jsdom',
          setupFiles: [environmentSetup],
          include: [
            resolve(root, 'tests/adapters/react/dom.contract.test.tsx'),
            resolve(root, 'tests/adapters/react/interface.integration.test.tsx'),
            resolve(root, 'tests/adapters/react/hydration.contract.test.tsx'),
          ],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
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
            '@': resolve(root, 'packages/vue/src'),
          },
        },
        test: {
          name: 'contract-vue-dom',
          environment: 'jsdom',
          setupFiles: [environmentSetup],
          include: [
            resolve(root, 'tests/adapters/vue/dom.contract.test.ts'),
            resolve(root, 'tests/adapters/vue/hydration.contract.test.ts'),
          ],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        test: {
          name: 'dist-react',
          environment: 'node',
          include: [resolve(root, 'tests/adapters/react/distribution.contract.test.ts')],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        test: {
          name: 'dist-vue',
          environment: 'node',
          include: [resolve(root, 'tests/adapters/vue/distribution.contract.test.ts')],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        test: {
          name: 'contract-governance',
          environment: 'node',
          include: [resolve(root, 'tests/contracts/spec-coverage.test.ts')],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        plugins: [react()],
        resolve: {
          alias: {
            '@': resolve(root, 'packages/react/src'),
          },
        },
        test: {
          name: 'contract-react-server',
          environment: 'node',
          include: [resolve(root, 'tests/adapters/react/server.contract.test.tsx')],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
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
            '@': resolve(root, 'packages/vue/src'),
          },
        },
        test: {
          name: 'contract-vue-server',
          environment: 'node',
          include: [resolve(root, 'tests/adapters/vue/server.contract.test.ts')],
          clearMocks: true,
          restoreMocks: true,
        },
      },
    ],
  },
})
