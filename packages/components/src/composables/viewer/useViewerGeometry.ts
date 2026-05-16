import type { MaybeRefOrGetter } from 'vue'
import { readonly, shallowRef, toValue } from 'vue'
import { isClient } from '@/utils/helpers'

export interface ViewerRect {
  top: number
  left: number
  width: number
  height: number
}

export function useViewerGeometry(options: {
  thumbnailTarget: MaybeRefOrGetter<HTMLElement | null | undefined>
  thumbnailImage?: MaybeRefOrGetter<HTMLImageElement | null | undefined>
  maxWidthRatio?: number
  maxHeightRatio?: number
}) {
  const {
    thumbnailTarget,
    thumbnailImage,
    maxWidthRatio = 0.9,
    maxHeightRatio = 0.9,
  } = options

  const destinationRect = shallowRef<ViewerRect | null>(null)

  const captureThumbnailRect = (): DOMRect | null => {
    return toValue(thumbnailTarget)?.getBoundingClientRect() ?? null
  }

  const resolveAspectRatio = (): number => {
    const image = thumbnailImage ? toValue(thumbnailImage) : null

    if (image?.naturalWidth && image.naturalHeight) {
      return image.naturalWidth / image.naturalHeight
    }

    const thumbnailRect = captureThumbnailRect()

    if (thumbnailRect && thumbnailRect.height > 0) {
      return thumbnailRect.width / thumbnailRect.height
    }

    return 1
  }

  const prepareDestinationRect = (): ViewerRect | null => {
    if (!isClient)
      return null

    const aspectRatio = resolveAspectRatio()
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

    destinationRect.value = {
      top: (viewportHeight - height) / 2,
      left: (viewportWidth - width) / 2,
      width,
      height,
    }

    return destinationRect.value
  }

  const resetDestinationRect = (): void => {
    destinationRect.value = null
  }

  const getViewportCenter = (): { x: number, y: number } | null => {
    const rect = destinationRect.value

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
    destinationRect: readonly(destinationRect),
    captureThumbnailRect,
    prepareDestinationRect,
    resetDestinationRect,
    getViewportCenter,
  }
}
