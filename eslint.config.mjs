import antfu from '@antfu/eslint-config'
import pluginReact from '@eslint-react/eslint-plugin'
import htmlParser from '@html-eslint/parser'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

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
}, {
  files: ['apps/demo/**/*.{html,ts,tsx,vue,mjs}'],
  plugins: { 'better-tailwindcss': betterTailwindcss },
  settings: {
    'better-tailwindcss': {
      cwd: './apps/demo',
      entryPoint: 'src/shared/app.css',
      rootFontSize: 16,
      strictness: 'loose',
    },
  },
  rules: {
    'better-tailwindcss/enforce-canonical-classes': 'warn',
    'better-tailwindcss/enforce-consistent-class-order': 'warn',
    'better-tailwindcss/enforce-consistent-important-position': 'warn',
    'better-tailwindcss/enforce-consistent-line-wrapping': 'warn',
    'better-tailwindcss/enforce-consistent-variable-syntax': 'error',
    'better-tailwindcss/enforce-consistent-variant-order': 'warn',
    'better-tailwindcss/no-concatenated-classes': 'error',
    'better-tailwindcss/no-conflicting-classes': 'error',
    'better-tailwindcss/no-deprecated-classes': 'error',
    'better-tailwindcss/no-duplicate-classes': 'error',
    'better-tailwindcss/no-unknown-classes': ['error', {
      ignore: ['^lucide$', '^lucide-github$'],
    }],
    'better-tailwindcss/no-unnecessary-whitespace': 'warn',
  },
}, {
  files: ['apps/demo/**/*.html'],
  languageOptions: {
    parser: htmlParser,
  },
})
