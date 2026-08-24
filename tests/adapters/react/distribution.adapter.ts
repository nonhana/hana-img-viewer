import type { DistributionAdapter } from '../../contracts/distribution/adapter'
import { resolve } from 'node:path'

export const reactDistributionAdapter: DistributionAdapter = {
  descriptor: {
    packageDir: resolve(import.meta.dirname, '../../../packages/react'),
    expectedArtifacts: ['index.js', 'index.d.ts', 'style.css', 'index.js.map'],
    expectedPackage: {
      exports: {
        '.': { types: './dist/index.d.ts', import: './dist/index.js' },
        './style.css': './dist/style.css',
      },
      files: ['dist'],
      main: './dist/index.js',
      module: './dist/index.js',
      sideEffects: ['**/*.css'],
      types: './dist/index.d.ts',
      peerDependencies: { 'react': '^19.0.0', 'react-dom': '^19.0.0' },
    },
    runtimeExportNames: ['HanaImgViewer', 'default'],
    requiredDeclarationNames: ['HanaImgViewerProps'],
    forbiddenDeclarationNames: ['HanaImgViewerHandle', 'PortalTarget', 'ThumbnailRenderProps', 'hana-img-viewer-core'],
    forbiddenRuntimeFragments: [
      'vite-plugin-css-injected-by-js',
      'document.createElement("style")',
      'document.createElement(\'style\')',
      'document.head.appendChild(',
    ],
  },
}
