import type { ViewerSourcePhase } from '@/types'
import { readonly, ref } from 'vue'
import { isClient } from '@/utils/helpers'

export interface UseViewerSourceOptions {
  src: () => string
  previewSrc: () => string | undefined
}

function loadImage(url: string): Promise<boolean> {
  if (!isClient)
    return Promise.resolve(false)

  return new Promise<boolean>((resolve) => {
    const image = new Image()

    image.onload = async () => {
      try {
        if (typeof image.decode === 'function')
          await image.decode()
      }
      catch {
        // Decoding is best-effort. A decoded failure after onload should not
        // hide a usable bitmap from the current session.
      }
      resolve(true)
    }

    image.onerror = () => resolve(false)
    image.src = url
  })
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
