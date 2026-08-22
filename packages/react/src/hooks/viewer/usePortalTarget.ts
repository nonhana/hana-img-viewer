import type { PortalTarget } from '@/types'
import { isBodyPortalTarget, resolvePortalTarget } from 'hana-img-viewer-core'

import { useEffect, useSyncExternalStore } from 'react'

export type PortalTargetMode
  = | 'unmounted'
    | 'body'
    | 'custom'
    | 'pending'
    | 'missing'

const warnedSelectors = new Set<string>()

// Mount detection via the external-store API: server snapshot is `false`
// (no DOM on the server), client snapshot is `true` as soon as hydration
// completes. Avoids the set-state-in-effect mount flag.
const subscribe = (): (() => void) => () => {}
const getClientSnapshot = (): boolean => true
const getServerSnapshot = (): boolean => false

export { resolvePortalTarget }

export interface UsePortalTargetReturn {
  isMounted: boolean
  mode: PortalTargetMode
  resolvedTarget: HTMLElement | null
  canMountOverlay: boolean
  isBodyTarget: boolean
}

export const usePortalTarget = (target: PortalTarget | undefined): UsePortalTargetReturn => {
  const isMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )

  const resolvedTarget = isMounted ? resolvePortalTarget(target) : null

  const mode: PortalTargetMode = !isMounted
    ? 'unmounted'
    : isBodyPortalTarget(target)
      ? 'body'
      : target === null
        ? 'pending'
        : resolvedTarget
          ? 'custom'
          : 'missing'

  const canMountOverlay = resolvedTarget !== null
  const isBodyTarget = mode === 'body'

  useEffect(() => {
    if (!import.meta.env.DEV)
      return

    const currentTarget = target

    if (
      mode !== 'missing'
      || typeof currentTarget !== 'string'
      || warnedSelectors.has(currentTarget)
    ) {
      return
    }

    warnedSelectors.add(currentTarget)

    console.warn(
      `[hana-img-viewer] portalTarget "${currentTarget}" was not found. Overlay mount was skipped.`,
    )
  }, [mode, target])

  return {
    isMounted,
    mode,
    resolvedTarget,
    canMountOverlay,
    isBodyTarget,
  }
}
