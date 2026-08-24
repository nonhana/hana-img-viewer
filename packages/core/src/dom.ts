import type { PortalTarget } from './types'

export const isHTMLElement = (value: unknown): value is HTMLElement => {
  return typeof window !== 'undefined' && value instanceof HTMLElement
}

export const isBodyPortalTarget = (target: PortalTarget | undefined): boolean => {
  if (typeof window === 'undefined')
    return false

  return target === undefined || target === 'body' || target === document.body
}

export const resolvePortalTarget = (target: PortalTarget | undefined): HTMLElement | null => {
  if (typeof window === 'undefined')
    return null

  if (isBodyPortalTarget(target))
    return document.body

  if (target === null)
    return null

  if (typeof target === 'string') {
    if (!target.trim())
      return null

    try {
      return document.querySelector<HTMLElement>(target)
    }
    catch {
      // Invalid selector: degrade to missing instead of throwing a
      // DOMException during render and crashing the host tree.
      return null
    }
  }

  return isHTMLElement(target) ? target : null
}

export const getScrollbarWidth = (): number => {
  if (typeof window === 'undefined')
    return 0

  return window.innerWidth - document.documentElement.clientWidth
}

export const resolveAspectRatio = (image: HTMLImageElement | null | undefined, thumbnailRect: DOMRect | null): number => {
  if (image?.naturalWidth && image.naturalHeight) {
    return image.naturalWidth / image.naturalHeight
  }

  if (thumbnailRect && thumbnailRect.height > 0) {
    return thumbnailRect.width / thumbnailRect.height
  }

  return 1
}

export const loadImage = (url: string): Promise<boolean> => {
  // SSR / non-browser runtimes without an Image constructor cannot preload.
  if (typeof Image === 'undefined')
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
