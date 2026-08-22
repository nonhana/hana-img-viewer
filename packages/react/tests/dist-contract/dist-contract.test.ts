import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from '../support/vitest'

const distDir = resolve(import.meta.dirname, '../../dist')
const packageJsonPath = resolve(import.meta.dirname, '../../package.json')

describe('dist contract', () => {
  it('checks for built artifacts after build', () => {
    expect(existsSync(resolve(distDir, 'index.js'))).toBe(true)
    expect(existsSync(resolve(distDir, 'index.d.ts'))).toBe(true)
    expect(existsSync(resolve(distDir, 'style.css'))).toBe(true)
  })

  it('keeps css extracted and removes runtime css injection stubs from js output', () => {
    const js = readFileSync(resolve(distDir, 'index.js'), 'utf8')
    const css = readFileSync(resolve(distDir, 'style.css'), 'utf8')

    expect(css.trim().length).toBeGreaterThan(0)
    expect(js).not.toMatch(/vite-plugin-css-injected-by-js/)
    expect(js).not.toMatch(/document\.createElement\((['"`])style\1\)/)
    expect(js).not.toMatch(/document\.head\.appendChild\(/)
  })

  it('exports the extracted stylesheet in the package contract', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>
      sideEffects?: boolean | string[]
    }

    expect(packageJson.exports?.['./style.css']).toBe('./dist/style.css')
    expect(packageJson.sideEffects).toEqual(['**/*.css'])
  })
})
