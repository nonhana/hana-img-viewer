import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from '../support/vitest'

const distDir = resolve(import.meta.dirname, '../../dist')
const packageJsonPath = resolve(import.meta.dirname, '../../package.json')

describe('dist contract', () => {
  it('contains the extracted runtime, declarations, css, and source map', () => {
    for (const file of ['index.js', 'index.d.ts', 'style.css', 'index.js.map'])
      expect(existsSync(resolve(distDir, file))).toBe(true)
  })

  it('keeps CSS extracted and default/named exports identical', async () => {
    const js = readFileSync(resolve(distDir, 'index.js'), 'utf8')
    const css = readFileSync(resolve(distDir, 'style.css'), 'utf8')
    const declarations = readFileSync(resolve(distDir, 'index.d.ts'), 'utf8')
    const publicTypes = readFileSync(resolve(distDir, 'public-types.d.ts'), 'utf8')
    const runtime = await import(resolve(distDir, 'index.js'))

    expect(css.trim().length).toBeGreaterThan(0)
    expect(js).not.toMatch(/vite-plugin-css-injected-by-js/)
    expect(js).not.toMatch(/document\.createElement\((['"`])style\1\)/)
    expect(js).not.toMatch(/document\.head\.appendChild\(/)
    expect(runtime.default).toBe(runtime.HanaImgViewer)
    expect(declarations).toContain('HanaImgViewerProps')
    expect(publicTypes).toContain('container')
    expect(publicTypes).toContain('minZoom')
    expect(publicTypes).toContain('maxZoom')
    expect(publicTypes).toContain('closeOnBackdropClick')
    expect(publicTypes).toContain('closeOnEscape')
    expect(declarations).not.toMatch(/HanaImgViewer(?:Emits|Exposed)/)
    expect(publicTypes).not.toMatch(/PortalTarget|portalTarget|enableDrag|closeOnMaskClick|enableKeyboard/)
  })

  it('keeps the package exports and peer contract precise', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>
      sideEffects?: boolean | string[]
      peerDependencies?: Record<string, string>
      files?: string[]
    }

    expect(packageJson.exports?.['./style.css']).toBe('./dist/style.css')
    expect(packageJson.sideEffects).toEqual(['**/*.css', 'src/index.ts'])
    expect(packageJson.files).toEqual(['dist'])
    expect(packageJson.peerDependencies).toEqual({ vue: '^3.5.0' })
  })
})
