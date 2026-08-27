import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const SSR_SUFFIX = '-ssr.html'
const SOURCE_EXTENSIONS = ['.ts', '.tsx']

function findSource(rootDir, framework, basename) {
  const matches = SOURCE_EXTENSIONS
    .map(extension => resolve(rootDir, 'src', framework, `${basename}${extension}`))
    .filter(existsSync)

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${basename} entry for ${framework}, found ${matches.length}`,
    )
  }

  return matches[0]
}

export function discoverDemoEntries(rootDir) {
  const absoluteRoot = resolve(rootDir)
  const htmlFiles = readdirSync(absoluteRoot, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
    .map(entry => entry.name)
    .sort()

  if (htmlFiles.length === 0)
    throw new Error(`No HTML entries found in ${absoluteRoot}`)

  const ssrEntries = htmlFiles
    .filter(file => file.endsWith(SSR_SUFFIX))
    .map((html) => {
      const framework = html.slice(0, -SSR_SUFFIX.length)
      if (!framework)
        throw new Error(`Invalid SSR HTML entry name: ${html}`)

      return {
        framework,
        html,
        htmlPath: resolve(absoluteRoot, html),
        ssrPath: findSource(absoluteRoot, framework, 'ssr'),
        hydrationPath: findSource(absoluteRoot, framework, 'main-ssr'),
      }
    })

  const frameworkNames = ssrEntries.map(entry => entry.framework)
  if (new Set(frameworkNames).size !== frameworkNames.length)
    throw new Error('Duplicate SSR framework names found')

  return {
    htmlFiles,
    clientInputs: Object.fromEntries(
      htmlFiles.map(html => [html, resolve(absoluteRoot, html)]),
    ),
    ssrEntries,
    expectedBundles: ssrEntries.map(entry => `${entry.framework}.mjs`).sort(),
  }
}
