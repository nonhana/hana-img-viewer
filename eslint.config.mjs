import antfu from '@antfu/eslint-config'
import pluginReact from '@eslint-react/eslint-plugin'

// Disable React rules for Vue files
const disableReactForVue = Object.fromEntries(
  Object.keys(pluginReact.configs.recommended.rules).map(rule => [rule, 'off']),
)

export default antfu({
  vue: true,
  react: true,
  jsx: { a11y: true },
  javascript: true,
  typescript: true,
  markdown: true,
  yaml: true,
  pnpm: true,
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/*.d.ts',
    '_notes/**',
    'apps/demo/components.d.ts',
    'apps/demo/auto-imports.d.ts',
  ],
  rules: {
    'antfu/top-level-function': 'off',
    'ts/no-use-before-define': 'off',
    'react-refresh/only-export-components': 'off',
  },
}, {
  files: ['**/*.{ts,tsx,mts,cts,mjs,cjs,js}'],
  ignores: [
    'packages/react/**',
    'apps/demo/src/vue/**',
    'eslint.config.mjs',
  ],
  rules: disableReactForVue,
}, {
  files: [
    'packages/vue/src/**',
    'packages/react/src/**',
    'packages/core/src/**',
  ],
  rules: {
    'func-style': ['error', 'expression', { allowArrowFunctions: true }],
  },
}, {
  files: ['**/tests/**', '**/*.test.{ts,tsx}'],
  rules: {
    'ts/no-non-null-assertion': 'off',
  },
})
