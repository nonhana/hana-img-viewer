import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { discoverDemoEntries } from './entries.mts'

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distDir = resolve(rootDir, 'dist')
const cacheDir = resolve(rootDir, 'node_modules/.cache/demo-ssr')
const mountMarker = '<div id="app"></div>'

interface PendingWrite {
  outputPath: string
  temporaryPath: string
}

function collectBundleFiles(directory: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory())
      files.push(...collectBundleFiles(path))
    else if (/\.m?js$/.test(entry.name))
      files.push(path)
  }
  return files
}

execFileSync('pnpm', ['exec', 'vite', 'build', '--ssr', '--config', 'vite.ssr.config.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
})

const entries = discoverDemoEntries(rootDir)
if (!existsSync(cacheDir))
  throw new Error(`SSR bundle directory is missing: ${cacheDir}`)

const actualBundles = readdirSync(cacheDir)
  .filter(file => file.endsWith('.mjs'))
  .sort()
const unexpectedBundles = actualBundles.filter(file => !entries.expectedBundles.includes(file))
const missingBundles = entries.expectedBundles.filter(file => !actualBundles.includes(file))
if (unexpectedBundles.length > 0 || missingBundles.length > 0) {
  throw new Error(
    `SSR bundle mismatch; missing=${missingBundles.join(',') || 'none'}, unexpected=${unexpectedBundles.join(',') || 'none'}`,
  )
}

const externalImportPattern = /^\s*(?:import|export)[^\n]*?from\s+["'](?:react(?:-dom)?|vue|@vue\/server-renderer|element-plus)[/"']/m
const cssImportPattern = /^\s*import\s+["'][^"']*(?:\.css|\/style\/css)[^"']*["']/m
for (const bundlePath of collectBundleFiles(cacheDir)) {
  const source = readFileSync(bundlePath, 'utf8')
  if (externalImportPattern.test(source) || cssImportPattern.test(source))
    throw new Error(`SSR bundle contains an external framework or CSS import: ${bundlePath}`)
}

const pendingWrites: PendingWrite[] = []
try {
  for (const entry of entries.ssrEntries) {
    const bundlePath = resolve(cacheDir, `${entry.framework}.mjs`)
    const mod = await import(`${bundlePath}?prerender=${Date.now()}`)
    if (typeof mod.default !== 'function')
      throw new Error(`SSR entry ${entry.framework} has no default render function`)

    const rendered: unknown = await mod.default()
    if (typeof rendered !== 'string' || rendered.trim().length === 0)
      throw new Error(`SSR entry ${entry.framework} rendered empty HTML`)

    const outputPath = resolve(distDir, entry.html)
    if (!existsSync(outputPath))
      throw new Error(`SSR HTML output is missing: ${outputPath}`)

    const source = readFileSync(outputPath, 'utf8')
    const markerCount = source.split(mountMarker).length - 1
    if (markerCount !== 1)
      throw new Error(`Expected one ${mountMarker} marker in ${entry.html}, found ${markerCount}`)

    const injected = source.replace(mountMarker, `<div id="app">${rendered}</div>`)
    const appContent = injected.match(/<div id="app">([\s\S]*?)<\/div>/)?.[1]?.trim()
    if (!appContent)
      throw new Error(`SSR HTML output is empty after injection: ${entry.html}`)

    const temporaryPath = `${outputPath}.tmp-${process.pid}`
    writeFileSync(temporaryPath, injected)
    pendingWrites.push({ outputPath, temporaryPath })
  }

  for (const { outputPath, temporaryPath } of pendingWrites) {
    renameSync(temporaryPath, outputPath)
  }
}
catch (error) {
  for (const { temporaryPath } of pendingWrites) {
    if (existsSync(temporaryPath))
      unlinkSync(temporaryPath)
  }
  throw error
}

for (const entry of entries.ssrEntries)
  console.log(`prerendered ${entry.html}`)
