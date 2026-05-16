import { getCurrentScope, onScopeDispose } from 'vue'

export const isClient = typeof window !== 'undefined'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function tryOnScopeDispose(fn: () => void): boolean {
  if (getCurrentScope()) {
    onScopeDispose(fn)
    return true
  }
  return false
}
