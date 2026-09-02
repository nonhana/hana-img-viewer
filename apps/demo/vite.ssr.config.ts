import type { Plugin } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { discoverDemoEntries } from './scripts/entries.mts'

const stripCss = {
  name: 'demo-strip-css',
  enforce: 'pre',
  resolveId(source: string) {
    if (source.endsWith('.css') || /\/style\/css(?:$|[?#])/.test(source))
      return `\0virtual:css:${source}`
  },
  load(id: string) {
    if (id.startsWith('\0virtual:css:'))
      return 'export default {}'
  },
} satisfies Plugin

const demoEntries = discoverDemoEntries(import.meta.dirname)

export default defineConfig({
  plugins: [
    stripCss,
    vue(),
    react(),
  ],
  resolve: {
    alias: {
      'hana-img-viewer-react': resolve(
        import.meta.dirname,
        '../../packages/react/src/index.ts',
      ),
      'hana-img-viewer': resolve(import.meta.dirname, '../../packages/vue/src/index.ts'),
    },
  },
  build: {
    ssr: true,
    outDir: 'node_modules/.cache/demo-ssr',
    emptyOutDir: true,
    rolldownOptions: {
      input: Object.fromEntries(
        demoEntries.ssrEntries.map(entry => [entry.framework, entry.ssrPath]),
      ),
      output: {
        entryFileNames: '[name].mjs',
      },
    },
  },
  ssr: {
    noExternal: true,
  },
})
