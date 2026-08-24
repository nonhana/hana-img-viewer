import type { DistributionAdapter } from '../../contracts/distribution/adapter'
import { resolve } from 'node:path'

export const vueDistributionAdapter: DistributionAdapter = {
  descriptor: {
    packageDir: resolve(import.meta.dirname, '../../../packages/vue'),
    expectedArtifacts: ['index.js', 'index.d.ts', 'style.css', 'index.js.map'],
    expectedPackage: {
      dependencies: {},
      exports: {
        '.': { types: './dist/index.d.ts', import: './dist/index.js' },
        './style.css': './dist/style.css',
      },
      files: ['dist'],
      main: './dist/index.js',
      module: './dist/index.js',
      sideEffects: ['**/*.css', 'src/index.ts'],
      types: './dist/index.d.ts',
      peerDependencies: { vue: '^3.5.0' },
      publishConfig: { access: 'public' },
    },
    runtimeExportNames: ['HanaImgViewer', 'default'],
    requiredDeclarationNames: ['HanaImgViewerProps'],
    forbiddenDeclarationNames: ['HanaImgViewerEmits', 'PortalTarget', 'enableDrag', 'hana-img-viewer-core'],
    forbiddenRuntimeFragments: [
      'vite-plugin-css-injected-by-js',
      'document.createElement("style")',
      'document.createElement(\'style\')',
      'document.head.appendChild(',
    ],
  },
}
