import type { PortalTarget } from '@/types'
import { computed, onMounted, shallowRef, watchEffect } from 'vue'
import { isClient } from '@/utils/helpers'

export type PortalTargetMode = 'unmounted' | 'body' | 'custom' | 'pending' | 'missing'

const warnedSelectors = new Set<string>()

function isHTMLElement(value: unknown): value is HTMLElement {
  return isClient && value instanceof HTMLElement
}

function isBodyPortalTarget(target: PortalTarget | undefined): boolean {
  if (!isClient)
    return false

  return target === undefined || target === 'body' || target === document.body
}

export function resolvePortalTarget(target: PortalTarget | undefined): HTMLElement | null {
  if (!isClient)
    return null

  if (isBodyPortalTarget(target))
    return document.body

  if (target === null)
    return null

  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target)
  }

  return isHTMLElement(target) ? target : null
}

export function usePortalTarget(target: () => PortalTarget | undefined) {
  const isMounted = shallowRef(false)

  onMounted(() => {
    isMounted.value = true
  })

  const resolvedTarget = computed(() => {
    if (!isMounted.value)
      return null

    return resolvePortalTarget(target())
  })

  const mode = computed<PortalTargetMode>(() => {
    if (!isMounted.value)
      return 'unmounted'

    const currentTarget = target()

    if (isBodyPortalTarget(currentTarget))
      return 'body'

    if (currentTarget === null)
      return 'pending'

    return resolvedTarget.value ? 'custom' : 'missing'
  })

  const canMountOverlay = computed(() => resolvedTarget.value !== null)
  const isBodyTarget = computed(() => mode.value === 'body')

  if (import.meta.env.DEV) {
    watchEffect(() => {
      const currentTarget = target()

      if (mode.value !== 'missing' || typeof currentTarget !== 'string' || warnedSelectors.has(currentTarget))
        return

      warnedSelectors.add(currentTarget)
      console.warn(`[hana-img-viewer] portalTarget "${currentTarget}" was not found. Overlay mount was skipped.`)
    })
  }

  return {
    isMounted,
    mode,
    resolvedTarget,
    canMountOverlay,
    isBodyTarget,
  }
}
