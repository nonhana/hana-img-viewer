import type { ViewerSourcePhase } from '@/types'
import { loadImage } from 'hana-img-viewer-core'
import { useRef, useState } from 'react'

export interface UseViewerSourceOptions {
  src: () => string
  previewSrc: () => string | undefined
}

export interface BeginViewerSourceSessionOptions {
  resetToBase?: boolean
}

export interface UseViewerSourceReturn {
  displaySrc: string
  sourcePhase: ViewerSourcePhase
  beginSession: (options?: BeginViewerSourceSessionOptions) => number
  endSession: () => void
  reset: () => void
  syncBaseSource: () => void
  startEnhancement: (activeSession?: number) => Promise<boolean>
}

export const useViewerSource = (options: UseViewerSourceOptions): UseViewerSourceReturn => {
  const { src, previewSrc } = options

  const srcRef = useRef(src)
  srcRef.current = src
  const previewSrcRef = useRef(previewSrc)
  previewSrcRef.current = previewSrc

  const [displaySrc, setDisplaySrc] = useState(() => src())
  const [sourcePhase, setSourcePhase] = useState<ViewerSourcePhase>('base')
  const sessionIdRef = useRef(0)
  const isSessionActiveRef = useRef(false)

  const syncBaseSource = (): void => {
    setDisplaySrc(srcRef.current())
    setSourcePhase('base')
  }

  const reset = (): void => {
    syncBaseSource()
  }

  const beginSession = (
    sessionOptions: BeginViewerSourceSessionOptions = {},
  ): number => {
    const { resetToBase = true } = sessionOptions

    sessionIdRef.current += 1
    isSessionActiveRef.current = true

    if (resetToBase)
      syncBaseSource()

    return sessionIdRef.current
  }

  const endSession = (): void => {
    sessionIdRef.current += 1
    isSessionActiveRef.current = false
  }

  const startEnhancement = async (
    activeSession = sessionIdRef.current,
  ): Promise<boolean> => {
    const nextPreviewSrc = previewSrcRef.current()

    if (
      !isSessionActiveRef.current
      || !nextPreviewSrc
      || nextPreviewSrc === srcRef.current()
    ) {
      return false
    }

    setSourcePhase('enhancing')

    const ready = await loadImage(nextPreviewSrc)

    if (!isSessionActiveRef.current || activeSession !== sessionIdRef.current) {
      return false
    }

    if (!ready) {
      setSourcePhase('enhance-error')
      return false
    }

    setDisplaySrc(nextPreviewSrc)
    setSourcePhase('enhanced')
    return true
  }

  return {
    displaySrc,
    sourcePhase,
    beginSession,
    endSession,
    reset,
    syncBaseSource,
    startEnhancement,
  }
}
