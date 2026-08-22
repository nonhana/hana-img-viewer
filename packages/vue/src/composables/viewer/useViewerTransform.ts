import type { Point } from 'hana-img-viewer-core'
import type { Transform, ViewerTransformAnchor } from '@/types'
import { clamp, DEFAULT_TRANSFORM, getZoomAnchoredPosition } from 'hana-img-viewer-core'
import { computed, readonly, ref } from 'vue'

export interface UseViewerTransformOptions {
  minScale: () => number
  maxScale: () => number
  step?: () => number
  doubleClickScale?: () => number
  onScaleChange?: (scale: number) => void
}

const buildAnchor = (anchor: Point | ViewerTransformAnchor | undefined): ViewerTransformAnchor | undefined => {
  if (!anchor)
    return undefined

  if ('viewportCenter' in anchor) {
    return anchor
  }

  if (typeof window === 'undefined') {
    return undefined
  }

  return {
    point: anchor,
    viewportCenter: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    },
  }
}

export const useViewerTransform = (options: UseViewerTransformOptions) => {
  const transform = ref<Transform>({ ...DEFAULT_TRANSFORM })
  let zoomBeforeDoubleClick: number | null = null

  const scale = computed(() => transform.value.scale)
  const canZoomIn = computed(() => scale.value < options.maxScale())
  const canZoomOut = computed(() => scale.value > options.minScale())
  const isInitialZoom = computed(() => Math.abs(scale.value - DEFAULT_TRANSFORM.scale) < 0.01)

  const clampScale = (nextScale: number): number => {
    return clamp(nextScale, options.minScale(), options.maxScale())
  }

  const notifyScaleChange = (nextScale: number, previousScale: number): void => {
    if (Math.abs(nextScale - previousScale) > 0.001) {
      options.onScaleChange?.(nextScale)
    }
  }

  const setTransform = (nextTransform: Partial<Transform>): void => {
    const previousScale = transform.value.scale

    transform.value = {
      ...transform.value,
      ...nextTransform,
      scale: clampScale(nextTransform.scale ?? transform.value.scale),
    }

    notifyScaleChange(transform.value.scale, previousScale)
  }

  const setScale = (nextScale: number, anchor?: Point | ViewerTransformAnchor): void => {
    const previousScale = transform.value.scale
    const clampedScale = clampScale(nextScale)

    if (clampedScale === previousScale)
      return

    const resolvedAnchor = buildAnchor(anchor)

    if (!resolvedAnchor) {
      transform.value = {
        ...transform.value,
        scale: clampedScale,
      }

      notifyScaleChange(clampedScale, previousScale)
      return
    }

    const nextPosition = getZoomAnchoredPosition(
      { x: transform.value.x, y: transform.value.y },
      resolvedAnchor.point,
      previousScale,
      clampedScale,
      resolvedAnchor.viewportCenter,
    )

    transform.value = {
      ...transform.value,
      x: nextPosition.x,
      y: nextPosition.y,
      scale: clampedScale,
    }

    notifyScaleChange(clampedScale, previousScale)
  }

  const pan = (delta: Point): void => {
    transform.value = {
      ...transform.value,
      x: transform.value.x + delta.x,
      y: transform.value.y + delta.y,
    }
  }

  const zoomIn = (anchor?: Point | ViewerTransformAnchor): void => {
    setScale(transform.value.scale + (options.step?.() ?? 0.5), anchor)
  }

  const zoomOut = (anchor?: Point | ViewerTransformAnchor): void => {
    setScale(transform.value.scale - (options.step?.() ?? 0.5), anchor)
  }

  const toggleDoubleClickZoom = (anchor?: Point | ViewerTransformAnchor): void => {
    const targetScale = options.doubleClickScale?.() ?? 2

    if (Math.abs(transform.value.scale - DEFAULT_TRANSFORM.scale) < 0.01) {
      zoomBeforeDoubleClick = transform.value.scale
      setScale(targetScale, anchor)
      return
    }

    setScale(zoomBeforeDoubleClick ?? DEFAULT_TRANSFORM.scale, anchor)
    zoomBeforeDoubleClick = null
  }

  const reset = (): void => {
    const previousScale = transform.value.scale
    transform.value = { ...DEFAULT_TRANSFORM }
    zoomBeforeDoubleClick = null
    notifyScaleChange(transform.value.scale, previousScale)
  }

  const transformCss = computed(() => {
    const { x, y, scale } = transform.value
    return `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  })

  const addScale = (delta: number, anchor?: Point | ViewerTransformAnchor): void => {
    setScale(transform.value.scale + delta, anchor)
  }

  const multiplyScale = (factor: number, anchor?: Point | ViewerTransformAnchor): void => {
    setScale(transform.value.scale * factor, anchor)
  }

  return {
    transform: readonly(transform),
    scale,
    transformCss,
    canZoomIn,
    canZoomOut,
    isInitialZoom,
    setScale,
    setTransform,
    pan,
    zoomIn,
    zoomOut,
    toggleDoubleClickZoom,
    reset,
    addScale,
    multiplyScale,
  }
}
