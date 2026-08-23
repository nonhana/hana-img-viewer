import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { describe, expect, it } from '../support/vitest'

const distDir = resolve(import.meta.dirname, '../../dist')
const packageJsonPath = resolve(import.meta.dirname, '../../package.json')

interface PackageJson {
  exports?: Record<string, unknown>
  files?: string[]
  main?: string
  module?: string
  sideEffects?: boolean | string[]
  types?: string
}

const readPackageJson = (): PackageJson =>
  JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson

describe('dist contract', () => {
  it('checks for built artifacts after build', () => {
    expect(existsSync(resolve(distDir, 'index.js'))).toBe(true)
    expect(existsSync(resolve(distDir, 'index.d.ts'))).toBe(true)
    expect(existsSync(resolve(distDir, 'style.css'))).toBe(true)
    expect(existsSync(resolve(distDir, 'index.js.map'))).toBe(true)
  })

  it('keeps css extracted and removes runtime css injection stubs from js output', () => {
    const js = readFileSync(resolve(distDir, 'index.js'), 'utf8')
    const css = readFileSync(resolve(distDir, 'style.css'), 'utf8')

    expect(css.trim().length).toBeGreaterThan(0)
    expect(js).not.toMatch(/vite-plugin-css-injected-by-js/)
    expect(js).not.toMatch(/document\.createElement\((['"`])style\1\)/)
    expect(js).not.toMatch(/document\.head\.appendChild\(/)
  })

  it('keeps the exact package metadata contract', () => {
    const packageJson = readPackageJson()

    expect({
      exports: packageJson.exports,
      files: packageJson.files,
      main: packageJson.main,
      module: packageJson.module,
      sideEffects: packageJson.sideEffects,
      types: packageJson.types,
    }).toEqual({
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
        },
        './style.css': './dist/style.css',
      },
      files: ['dist'],
      main: './dist/index.js',
      module: './dist/index.js',
      sideEffects: ['**/*.css'],
      types: './dist/index.d.ts',
    })
  })

  it('exports one component identity as default and named', async () => {
    const entry = await import(pathToFileURL(resolve(distDir, 'index.js')).href)

    expect(entry.default).toBe(entry.HanaImgViewer)
    expect(Object.keys(entry).sort()).toEqual(['HanaImgViewer', 'default'])
  })

  it('exposes only HanaImgViewerProps through the declaration graph', () => {
    const visited = new Set<string>()
    const pending = [resolve(distDir, 'index.d.ts')]
    let declarationGraph = ''

    while (pending.length > 0) {
      const file = pending.pop()!
      if (visited.has(file))
        continue

      visited.add(file)
      const source = readFileSync(file, 'utf8')
      declarationGraph += `\n${source}`

      for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const specifier = match[1]
        const candidate = resolve(
          dirname(file),
          extname(specifier) ? specifier : `${specifier}.d.ts`,
        )
        if (existsSync(candidate))
          pending.push(candidate)
      }
    }

    expect(declarationGraph).toContain('HanaImgViewerProps')
    const exportedTypeNames = [
      ...declarationGraph.matchAll(/export\s+(?:interface|type)\s+(\w+)/g),
    ].map(match => match[1])
    expect([...new Set(exportedTypeNames)]).toEqual(['HanaImgViewerProps'])
    expect(declarationGraph).not.toMatch(
      /HanaImgViewerHandle|PortalTarget|ThumbnailRenderProps/,
    )
    expect(declarationGraph).not.toContain('hana-img-viewer-core')
  })
})
