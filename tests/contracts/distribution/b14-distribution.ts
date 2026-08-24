import type { DistributionAdapter } from './adapter'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const readJson = (file: string): Record<string, unknown> => JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>

const collectDeclarations = (entry: string) => {
  const pending = [entry]
  const visited = new Set<string>()
  let source = ''
  while (pending.length > 0) {
    const file = pending.pop()!
    if (visited.has(file))
      continue
    visited.add(file)
    const contents = readFileSync(file, 'utf8')
    source += `\n${contents}`
    for (const match of contents.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const specifier = match[1]
      const candidate = resolve(dirname(file), extname(specifier) ? specifier : `${specifier}.d.ts`)
      if (existsSync(candidate))
        pending.push(candidate)
    }
  }
  return source
}

export const registerB14Distribution = (adapter: DistributionAdapter) => {
  describe('[behavior/B14] distribution and styles', () => {
    it('contains fresh artifacts and extracted CSS', () => {
      const { packageDir, expectedArtifacts } = adapter.descriptor
      const distDir = resolve(packageDir, 'dist')
      for (const artifact of expectedArtifacts)
        expect(existsSync(resolve(distDir, artifact))).toBe(true)
      expect(readFileSync(resolve(distDir, 'style.css'), 'utf8').trim()).not.toBe('')
    })

    it('keeps CSS extracted and avoids runtime injection', () => {
      const { packageDir, forbiddenRuntimeFragments } = adapter.descriptor
      const js = readFileSync(resolve(packageDir, 'dist/index.js'), 'utf8')
      for (const fragment of forbiddenRuntimeFragments)
        expect(js).not.toContain(fragment)
    })

    it('matches the exact package metadata and runtime export surface', async () => {
      const { packageDir, expectedPackage, runtimeExportNames } = adapter.descriptor
      const packageJson = readJson(resolve(packageDir, 'package.json'))
      expect({
        dependencies: packageJson.dependencies ?? {},
        exports: packageJson.exports,
        files: packageJson.files,
        main: packageJson.main,
        module: packageJson.module,
        sideEffects: packageJson.sideEffects,
        types: packageJson.types,
        peerDependencies: packageJson.peerDependencies,
        publishConfig: packageJson.publishConfig,
      }).toEqual(expectedPackage)

      const runtime = await import(pathToFileURL(resolve(packageDir, 'dist/index.js')).href)
      expect(Object.keys(runtime).sort()).toEqual([...runtimeExportNames].sort())
      expect(runtime.default).toBe(runtime.HanaImgViewer)
    })

    it('keeps the reachable declaration graph public and minimal', () => {
      const { packageDir, requiredDeclarationNames, forbiddenDeclarationNames } = adapter.descriptor
      const source = collectDeclarations(resolve(packageDir, 'dist/index.d.ts'))
      for (const name of requiredDeclarationNames)
        expect(source).toContain(name)
      for (const name of forbiddenDeclarationNames)
        expect(source).not.toContain(name)
      const exportedTypeNames = [...source.matchAll(/export\s+(?:interface|type)\s+(\w+)/g)].map(match => match[1])
      expect([...new Set(exportedTypeNames)]).toEqual(['HanaImgViewerProps'])
    })
  })
}
