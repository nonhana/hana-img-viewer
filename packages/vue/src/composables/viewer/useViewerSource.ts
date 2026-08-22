import type { ViewerSourcePhase } from '@/types'
import { loadImage } from 'hana-img-viewer-core'
import { readonly, ref } from 'vue'

export interface UseViewerSourceOptions {
  src: () => string
  previewSrc: () => string | undefined
}

export interface BeginViewerSourceSessionOptions {
  resetToBase?: boolean
}

export const useViewerSource = (options: UseViewerSourceOptions) => {
  const displaySrc = ref(options.src())
  const sourcePhase = ref<ViewerSourcePhase>('base')
  const sessionId = ref(0)
  const isSessionActive = ref(false)

  const syncBaseSource = (): void => {
    displaySrc.value = options.src()
    sourcePhase.value = 'base'
  }

  const reset = (): void => {
    syncBaseSource()
  }

  const beginSession = (sessionOptions: BeginViewerSourceSessionOptions = {}): number => {
    const { resetToBase = true } = sessionOptions

    sessionId.value += 1
    isSessionActive.value = true

    if (resetToBase)
      syncBaseSource()

    return sessionId.value
  }

  const endSession = (): void => {
    sessionId.value += 1
    isSessionActive.value = false
  }

  const startEnhancement = async (activeSession = sessionId.value): Promise<boolean> => {
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
