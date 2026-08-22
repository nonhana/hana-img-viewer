import { resolveAspectRatio } from 'hana-img-viewer-core'
import { useRef, useState } from 'react'
import { isClient } from '@/utils/helpers'

export interface ViewerRect {
  top: number
  left: number
  width: number
  height: number
}

export interface UseViewerGeometryOptions {
  thumbnailTarget: () => HTMLElement | null
  thumbnailImage?: () => HTMLImageElement | null
  maxWidthRatio?: number
  maxHeightRatio?: number
}

export interface UseViewerGeometryReturn {
  destinationRect: ViewerRect | null
  captureThumbnailRect: () => DOMRect | null
  prepareDestinationRect: () => ViewerRect | null
  resetDestinationRect: () => void
  getViewportCenter: () => { x: number, y: number } | null
}

export const useViewerGeometry = (options: UseViewerGeometryOptions): UseViewerGeometryReturn => {
  const {
    thumbnailTarget,
    thumbnailImage,
    maxWidthRatio = 0.9,
    maxHeightRatio = 0.9,
  } = options

  const [destinationRect, setDestinationRect] = useState<ViewerRect | null>(
    null,
  )
  const targetRef = useRef(thumbnailTarget)
  targetRef.current = thumbnailTarget
  const imageRef = useRef(thumbnailImage)
  imageRef.current = thumbnailImage

  const captureThumbnailRect = (): DOMRect | null => {
    return targetRef.current()?.getBoundingClientRect() ?? null
  }

  const prepareDestinationRect = (): ViewerRect | null => {
    if (!isClient)
      return null

    const aspectRatio = resolveAspectRatio(
      imageRef.current ? imageRef.current() : null,
      captureThumbnailRect(),
    )
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const maxWidth = viewportWidth * maxWidthRatio
    const maxHeight = viewportHeight * maxHeightRatio

    let width = maxWidth
    let height = width / aspectRatio

    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    const rect: ViewerRect = {
      top: (viewportHeight - height) / 2,
      left: (viewportWidth - width) / 2,
      width,
      height,
    }

    setDestinationRect(rect)

    return rect
  }

  const resetDestinationRect = (): void => {
    setDestinationRect(null)
  }

  const getViewportCenter = (): { x: number, y: number } | null => {
    const rect = destinationRect

    if (!rect) {
      if (!isClient)
        return null

      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }
    }

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  return {
    destinationRect,
    captureThumbnailRect,
    prepareDestinationRect,
    resetDestinationRect,
    getViewportCenter,
  }
}
