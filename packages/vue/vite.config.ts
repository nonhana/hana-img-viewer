import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      isProduction: true,
      template: {
        compilerOptions: {
          comments: false,
        },
      },
    }),
    dts({
      tsconfigPath: './tsconfig.json',
      outDirs: 'dist',
      staticImport: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: true,
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      fileName: 'index',
      cssFileName: 'style',
      formats: ['es'],
    },
    rolldownOptions: {
      external: ['vue'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
})
