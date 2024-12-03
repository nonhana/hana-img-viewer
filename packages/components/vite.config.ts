import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: './tsconfig.json' }),
    dts({ tsconfigPath: './tsconfig.json', outDir: 'dist/lib' }),
    {
      name: 'handle-css',
      generateBundle(_, bundle) {
        const keys = Object.keys(bundle)
        for (const key of keys) {
          const bundler: any = bundle[key]
          if (bundler.name !== 'index') continue
          this.emitFile({
            type: 'asset',
            fileName: key,
            source: "import './index.css';\n" + bundler.code,
          })
        }
      },
    },
  ],
  build: {
    target: 'modules',
    outDir: 'dist/es',
    minify: true,
    cssCodeSplit: true,
    lib: {
      entry: './src/index.ts',
    },
    rollupOptions: {
      external: ['vue'],
      input: ['./src/index.ts'],
      output: [
        {
          format: 'esm',
          exports: 'named',
          entryFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
          dir: 'dist/es',
        },
        {
          format: 'cjs',
          exports: 'named',
          entryFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
          dir: 'dist/lib',
        },
      ],
    },
  },
})
