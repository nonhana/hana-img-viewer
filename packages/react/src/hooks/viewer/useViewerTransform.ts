import type { Point } from 'hana-img-viewer-core'

import type { Transform, ViewerTransformAnchor } from '@/types'
import { clamp, DEFAULT_TRANSFORM, getZoomAnchoredPosition } from 'hana-img-viewer-core'

import { useRef, useState } from 'react'

export interface UseViewerTransformOptions {
  minScale: () => number
  maxScale: () => number
  step?: () => number
  doubleClickScale?: () => number
  onScaleChange?: (scale: number) => void
}

export interface UseViewerTransformReturn {
  transform: Transform
  scale: number
  transformCss: string
  canZoomIn: boolean
  canZoomOut: boolean
  isInitialZoom: boolean
  setScale: (nextScale: number, anchor?: Point | ViewerTransformAnchor) => void
  setTransform: (nextTransform: Partial<Transform>) => void
  pan: (delta: Point) => void
  zoomIn: (anchor?: Point | ViewerTransformAnchor) => void
  zoomOut: (anchor?: Point | ViewerTransformAnchor) => void
  toggleDoubleClickZoom: (anchor?: Point | ViewerTransformAnchor) => void
  reset: () => void
  addScale: (delta: number, anchor?: Point | ViewerTransformAnchor) => void
  multiplyScale: (
    factor: number,
    anchor?: Point | ViewerTransformAnchor,
  ) => void
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

export const useViewerTransform = (options: UseViewerTransformOptions): UseViewerTransformReturn => {
  const { minScale, maxScale, step, doubleClickScale, onScaleChange } = options

  const [transformState, setTransformState] = useState({
    ...DEFAULT_TRANSFORM,
  })
  const transformRef = useRef(transformState)
  transformRef.current = transformState
  const zoomBeforeDoubleClickRef = useRef<number | null>(null)
  const configRef = useRef({
    minScale,
    maxScale,
    step,
    doubleClickScale,
    onScaleChange,
  })
  configRef.current = {
    minScale,
    maxScale,
    step,
    doubleClickScale,
    onScaleChange,
  }

  const commit = (nextTransform: Transform): void => {
    transformRef.current = nextTransform
    setTransformState(nextTransform)
  }

  const clampScale = (nextScale: number): number => {
    return clamp(
      nextScale,
      configRef.current.minScale(),
      configRef.current.maxScale(),
    )
  }

  const notifyScaleChange = (nextScale: number, previousScale: number): void => {
    if (Math.abs(nextScale - previousScale) > 0.001) {
      configRef.current.onScaleChange?.(nextScale)
    }
  }

  const scale = transformState.scale
  const canZoomIn = scale < configRef.current.maxScale()
  const canZoomOut = scale > configRef.current.minScale()
  const isInitialZoom = Math.abs(scale - DEFAULT_TRANSFORM.scale) < 0.01

  const setTransform = (nextTransform: Partial<Transform>): void => {
    const previousScale = transformRef.current.scale

    commit({
      ...transformRef.current,
      ...nextTransform,
      scale: clampScale(nextTransform.scale ?? transformRef.current.scale),
    })

    notifyScaleChange(transformRef.current.scale, previousScale)
  }

  const setScale = (
    nextScale: number,
    anchor?: Point | ViewerTransformAnchor,
  ): void => {
    const previousScale = transformRef.current.scale
    const clampedScale = clampScale(nextScale)

    if (clampedScale === previousScale)
      return

    const resolvedAnchor = buildAnchor(anchor)

    if (!resolvedAnchor) {
      commit({
        ...transformRef.current,
        scale: clampedScale,
      })

      notifyScaleChange(clampedScale, previousScale)
      return
    }

    const nextPosition = getZoomAnchoredPosition(
      { x: transformRef.current.x, y: transformRef.current.y },
      resolvedAnchor.point,
      previousScale,
      clampedScale,
      resolvedAnchor.viewportCenter,
    )

    commit({
      ...transformRef.current,
      x: nextPosition.x,
      y: nextPosition.y,
      scale: clampedScale,
    })

    notifyScaleChange(clampedScale, previousScale)
  }

  const pan = (delta: Point): void => {
    const current = transformRef.current
    commit({
      ...current,
      x: current.x + delta.x,
      y: current.y + delta.y,
    })
  }

  const zoomIn = (anchor?: Point | ViewerTransformAnchor): void => {
    setScale(
      transformRef.current.scale + (configRef.current.step?.() ?? 0.5),
      anchor,
    )
  }

  const zoomOut = (anchor?: Point | ViewerTransformAnchor): void => {
    setScale(
      transformRef.current.scale - (configRef.current.step?.() ?? 0.5),
      anchor,
    )
  }

  const toggleDoubleClickZoom = (anchor?: Point | ViewerTransformAnchor): void => {
    const targetScale = configRef.current.doubleClickScale?.() ?? 2

    if (Math.abs(transformRef.current.scale - DEFAULT_TRANSFORM.scale) < 0.01) {
      zoomBeforeDoubleClickRef.current = transformRef.current.scale
      setScale(targetScale, anchor)
      return
    }

    setScale(
      zoomBeforeDoubleClickRef.current ?? DEFAULT_TRANSFORM.scale,
      anchor,
    )
    zoomBeforeDoubleClickRef.current = null
  }

  const reset = (): void => {
    const previousScale = transformRef.current.scale
    commit({ ...DEFAULT_TRANSFORM })
    zoomBeforeDoubleClickRef.current = null
    notifyScaleChange(transformRef.current.scale, previousScale)
  }

  const transformCss = `translate3d(${transformState.x}px, ${transformState.y}px, 0) scale(${transformState.scale})`

  const addScale = (
    delta: number,
    anchor?: Point | ViewerTransformAnchor,
  ): void => {
    setScale(transformRef.current.scale + delta, anchor)
  }

  const multiplyScale = (
    factor: number,
    anchor?: Point | ViewerTransformAnchor,
  ): void => {
    setScale(transformRef.current.scale * factor, anchor)
  }

  return {
    transform: transformState,
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
