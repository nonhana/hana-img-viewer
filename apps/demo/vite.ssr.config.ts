import type { Plugin } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { discoverDemoEntries } from './scripts/entries.mjs'

// SSR bundle：构建时预渲染用，产物自包含（noExternal 内联全部依赖），
// 落在 node_modules/.cache/demo-ssr，不随 dist 发布。
//
// 预渲染只需要 HTML 结构，样式由 client bundle 的 css 资产负责；
// 因此把一切 .css import 替换为空模块，避免 Node 直接加载 .mjs 时撞上 CSS 文件。
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
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      'hana-img-viewer-react/style.css': resolve(
        import.meta.dirname,
        '../../packages/react/src/style.css',
      ),
      'hana-img-viewer-react': resolve(
        import.meta.dirname,
        '../../packages/react/src/index.ts',
      ),
      'hana-img-viewer': resolve(import.meta.dirname, '../../packages/vue/src/index.ts'),
      '@': resolve(import.meta.dirname, '../../packages/react/src'),
    },
  },
  build: {
    ssr: true,
    outDir: 'node_modules/.cache/demo-ssr',
    emptyOutDir: true,
    rollupOptions: {
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
