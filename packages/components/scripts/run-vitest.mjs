import { spawn } from 'node:child_process'
import process from 'node:process'
import { resolvePnpmPackageFile } from './pnpm-store.mjs'

const vitestEntrypoint = resolvePnpmPackageFile('vitest', 'vitest.mjs')
const child = spawn(process.execPath, [vitestEntrypoint, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
