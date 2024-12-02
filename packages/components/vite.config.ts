import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.json' })],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'HanaImgViewer',
      fileName: (format) => `lib.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      input: ['./src/index.ts'],
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
        dir: 'dist',
      },
    },
  },
})
