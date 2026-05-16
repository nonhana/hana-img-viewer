import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  javascript: true,
  typescript: true,
  markdown: true,
  yaml: true,
  pnpm: true,
  ignores: [
    '.omx/**',
    'packages/components/dist/**',
  ],
  rules: {
    'ts/no-use-before-define': 'off',
  },
})
