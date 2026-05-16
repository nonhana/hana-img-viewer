import { pathToFileURL } from 'node:url'
import { resolvePnpmPackageFile } from './pnpm-store.mjs'

const vitestConfigUrl = pathToFileURL(resolvePnpmPackageFile('vitest', 'dist/config.js')).href
const vitestConfigModule = await import(vitestConfigUrl)

export const { defineConfig, mergeConfig } = vitestConfigModule
