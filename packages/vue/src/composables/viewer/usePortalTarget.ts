import type { PortalTarget } from '@/types'
import { isBodyPortalTarget, resolvePortalTarget } from 'hana-img-viewer-core'
import { computed, onMounted, shallowRef, watchEffect } from 'vue'

export type PortalTargetMode = 'unmounted' | 'body' | 'custom' | 'pending' | 'missing'

const warnedSelectors = new Set<string>()

export { resolvePortalTarget }

export const usePortalTarget = (target: () => PortalTarget | undefined) => {
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
      console.warn(`[hana-img-viewer] portalTarget "${currentTarget}" was not found or is an invalid selector. Overlay mount was skipped.`)
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
