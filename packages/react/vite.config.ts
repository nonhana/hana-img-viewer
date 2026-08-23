import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      outDirs: 'dist',
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['tests', 'node_modules'],
    }),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: true,
    sourcemap: true, // F5b: only way consumers can map library stack traces
    cssCodeSplit: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      // 'name' removed — no UMD/IIFE output, so it was dead config
      fileName: 'index',
      cssFileName: 'style',
      formats: ['es'],
    },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
})
