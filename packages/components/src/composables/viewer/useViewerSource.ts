import type { ViewerSourcePhase } from '@/types'
import { readonly, ref } from 'vue'
import { isClient } from '@/utils/helpers'

export interface UseViewerSourceOptions {
  src: () => string
  previewSrc: () => string | undefined
}

const resolvedCache = new Set<string>()
const pendingCache = new Map<string, Promise<boolean>>()

function loadImage(url: string): Promise<boolean> {
  if (!isClient)
    return Promise.resolve(false)

  if (resolvedCache.has(url))
    return Promise.resolve(true)

  const existing = pendingCache.get(url)
  if (existing)
    return existing

  const task = new Promise<boolean>((resolve) => {
    const image = new Image()

    const finish = (ready: boolean) => {
      pendingCache.delete(url)

      if (ready)
        resolvedCache.add(url)

      resolve(ready)
    }

    image.onload = async () => {
      try {
        if (typeof image.decode === 'function') {
          await image.decode()
        }
      }
      catch {
        // Decoding is best-effort. A decoded failure after onload should not
        // hide a usable bitmap from the current session.
      }

      finish(true)
    }

    image.onerror = () => finish(false)
    image.src = url
  })

  pendingCache.set(url, task)
  return task
}

export interface BeginViewerSourceSessionOptions {
  resetToBase?: boolean
}

export function useViewerSource(options: UseViewerSourceOptions) {
  const displaySrc = ref(options.src())
  const sourcePhase = ref<ViewerSourcePhase>('base')
  const sessionId = ref(0)
  const isSessionActive = ref(false)

  function syncBaseSource(): void {
    displaySrc.value = options.src()
    sourcePhase.value = 'base'
  }

  function reset(): void {
    syncBaseSource()
  }

  function beginSession(sessionOptions: BeginViewerSourceSessionOptions = {}): number {
    const { resetToBase = true } = sessionOptions

    sessionId.value += 1
    isSessionActive.value = true

    if (resetToBase)
      syncBaseSource()

    return sessionId.value
  }

  function endSession(): void {
    sessionId.value += 1
    isSessionActive.value = false
  }

  async function startEnhancement(activeSession = sessionId.value): Promise<boolean> {
    const nextPreviewSrc = options.previewSrc()

    if (!isSessionActive.value || !nextPreviewSrc || nextPreviewSrc === options.src()) {
      return false
    }

    sourcePhase.value = 'enhancing'

    const ready = await loadImage(nextPreviewSrc)

    if (!isSessionActive.value || activeSession !== sessionId.value) {
      return false
    }

    if (!ready) {
      sourcePhase.value = 'enhance-error'
      return false
    }

    displaySrc.value = nextPreviewSrc
    sourcePhase.value = 'enhanced'
    return true
  }

  return {
    displaySrc: readonly(displaySrc),
    sourcePhase: readonly(sourcePhase),
    beginSession,
    endSession,
    reset,
    syncBaseSource,
    startEnhancement,
  }
}
