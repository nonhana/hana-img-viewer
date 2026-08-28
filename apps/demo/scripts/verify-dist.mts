import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distDir = resolve(rootDir, process.argv[2] ?? 'dist')
const expectedHtml = ['index.html', 'react-ssr.html', 'react.html', 'vue-ssr.html', 'vue.html']
const appPages = ['vue.html', 'react.html', 'vue-ssr.html', 'react-ssr.html']
const spaPages = ['vue.html', 'react.html']
const ssrPages = ['vue-ssr.html', 'react-ssr.html']

const countMatches = (source: string, pattern: RegExp) => [...source.matchAll(pattern)].length

function fail(message: string): never {
  throw new Error(`Demo dist verification failed: ${message}`)
}

function walk(directory: string): string[] {
  const paths: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory())
      paths.push(...walk(path))
    else
      paths.push(path)
  }
  return paths
}

if (!existsSync(distDir))
  fail(`missing directory ${distDir}`)

const htmlFiles = readdirSync(distDir)
  .filter(file => file.endsWith('.html'))
  .sort()
if (htmlFiles.join('\n') !== expectedHtml.join('\n'))
  fail(`expected HTML entries ${expectedHtml.join(', ')}, found ${htmlFiles.join(', ')}`)

const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf8')
for (const page of appPages) {
  if (!indexHtml.includes(`href="/${page}"`))
    fail(`index.html does not link to /${page}`)
}

for (const page of appPages) {
  const html = readFileSync(resolve(distDir, page), 'utf8')
  if (countMatches(html, /<script[^>]*type=["']module["'][^>]*>/g) !== 1)
    fail(`${page} must contain exactly one module script`)
  if (countMatches(html, /<link[^>]*rel=["']stylesheet["'][^>]*>/g) < 1)
    fail(`${page} is missing a stylesheet link`)

  const appMatch = html.match(/<div id="app">([\s\S]*?)<\/div>/)
  if (!appMatch)
    fail(`${page} is missing the #app mount point`)

  const appContent = appMatch[1].trim()
  if (spaPages.includes(page) && appContent)
    fail(`${page} must retain an empty #app for client rendering`)
  if (ssrPages.includes(page)) {
    if (!appContent)
      fail(`${page} must contain prerendered #app content`)
    if (!/<img\b/i.test(appContent))
      fail(`${page} prerendered content must include a thumbnail image`)
  }
}

const generatedPaths = walk(distDir)
if (generatedPaths.some(path => path.includes('.ssr') || path.endsWith('.tmp')))
  fail('contains an SSR intermediate directory or temporary output')

console.log(`verified ${htmlFiles.length} HTML entries in ${distDir}`)
