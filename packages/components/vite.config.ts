import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

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
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
    },
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HanaImgViewer',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        assetFileNames: 'index.[ext]',
      },
    },
  },
})
