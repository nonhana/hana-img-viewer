import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

export const packageRoot = resolve(import.meta.dirname, '..')
export const workspaceRoot = resolve(packageRoot, '../..')
const virtualStoreRoot = resolve(workspaceRoot, 'node_modules/.pnpm')

const requireFromWorkspace = createRequire(join(workspaceRoot, 'package.json'))

function packageNameToStorePrefix(packageName) {
  return `${packageName.replaceAll('/', '+')}@`
}

function getInstalledVersion(packageName) {
  try {
    const packageJsonPath = requireFromWorkspace.resolve(`${packageName}/package.json`)
    const packageJson = requireFromWorkspace(packageJsonPath)
    return packageJson.version
  }
  catch {
    return null
  }
}

function listCandidates(packageName) {
  if (!existsSync(virtualStoreRoot)) {
    return []
  }

  const prefix = packageNameToStorePrefix(packageName)
  return readdirSync(virtualStoreRoot)
    .filter(candidate => candidate.startsWith(prefix))
    .sort()
}

function scoreCandidate(candidate, preferFragments) {
  let score = 0

  for (const fragment of preferFragments) {
    if (fragment && candidate.includes(fragment)) {
      score += 10
    }
  }

  return score
}

export function resolvePnpmPackageRoot(packageName) {
  const candidates = listCandidates(packageName)

  if (candidates.length === 0) {
    throw new Error(`Unable to find ${packageName} in ${virtualStoreRoot}`)
  }

  const installedVersion = getInstalledVersion(packageName)
  const vueVersion = getInstalledVersion('vue')
  const preferFragments = [
    installedVersion ? `@${installedVersion}` : null,
    vueVersion ? `vue@${vueVersion}` : null,
  ]

  const winner = candidates
    .map(candidate => ({
      candidate,
      score: scoreCandidate(candidate, preferFragments),
    }))
    .sort((left, right) => right.score - left.score || left.candidate.localeCompare(right.candidate))[0]

  return join(virtualStoreRoot, winner.candidate, 'node_modules', packageName)
}

export function resolvePnpmPackageFile(packageName, relativePath) {
  return join(resolvePnpmPackageRoot(packageName), relativePath)
}
