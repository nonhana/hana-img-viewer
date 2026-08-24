import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fg from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { contractIds } from './manifest'

const root = resolve(import.meta.dirname, '../..')
const specPath = resolve(root, 'docs/behavior-spec.md')
const contractPaths = fg.sync(['tests/contracts/**/*.ts'], { cwd: root, absolute: true })
const adapterPaths = fg.sync(['tests/adapters/**/*.ts', 'tests/adapters/**/*.tsx'], { cwd: root, absolute: true })

describe('[governance] contract coverage', () => {
  it('keeps behavior IDs in the spec and manifest exactly aligned', () => {
    const spec = readFileSync(specPath, 'utf8')
    const specIds = [...spec.matchAll(/^\|\s*(B(?:1[0-4]|[1-9]))\s*\|/gm)].map(match => match[1])
    expect([...new Set(specIds)].sort()).toEqual([...contractIds].sort())
  })

  it('requires every shared behavior module to carry its registered ID', () => {
    const sources = contractPaths.map(path => readFileSync(path, 'utf8')).join('\n')
    for (const id of contractIds)
      expect(sources).toContain(`[behavior/${id}]`)
  })

  it('rejects skipped contract cases and implementation imports in adapters', () => {
    const contractSource = contractPaths.map(path => readFileSync(path, 'utf8')).join('\n')
    const adapterSource = adapterPaths.map(path => readFileSync(path, 'utf8')).join('\n')
    expect(contractSource).not.toMatch(/\.(?:skip|todo|fails)\s*\(/)
    expect(adapterSource).not.toMatch(/src\/internal|@\/internal|packages\/(?:react|vue)\/src\/internal/)
  })

  it('keeps framework-specific imports out of shared contract bodies', () => {
    const sharedSource = contractPaths
      .filter(path => path.includes('/tests/contracts/'))
      .map(path => readFileSync(path, 'utf8'))
      .join('\n')
    expect(sharedSource).not.toMatch(/from\s+['"](?:react|vue|@testing-library\/react|@vue\/test-utils)['"]|from\s+['"][^'"]*src\/internal/)
  })

  it('leaves package tests with unit ownership only', () => {
    const packageTestPaths = fg.sync(
      ['packages/react/**/*.test.*', 'packages/vue/**/*.test.*'],
      { cwd: root, absolute: true, ignore: ['**/dist/**', '**/node_modules/**'] },
    )
    expect(packageTestPaths.map(path => path.replace(`${root}/`, '')).sort()).toEqual([
      'packages/react/src/internal/viewer-reducer.unit.test.ts',
      'packages/vue/src/internal/viewer-state.unit.test.ts',
    ])
  })
})
