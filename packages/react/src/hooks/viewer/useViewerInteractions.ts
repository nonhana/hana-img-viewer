import type { Point, ViewerTransformAnchor } from '@/types'

import { useEffect, useRef } from 'react'

import { useDrag, usePinch, useWheel } from '@/hooks/core'

export interface UseViewerInteractionsOptions {
  target: HTMLElement | null
  zoomTarget?: HTMLElement | null
  enabled: boolean
  enableDrag: boolean
  enableZoom: boolean
  enableKeyboard: boolean
  enablePinch?: boolean
  onPan: (delta: Point) => void
  onWheelZoom: (delta: number, anchor: ViewerTransformAnchor) => void
  onPinchZoom?: (scaleDelta: number, anchor: ViewerTransformAnchor) => void
  onDoubleClick: (anchor: ViewerTransformAnchor) => void
  onEscape: () => void
  getViewportCenter?: () => Point | null
}

export interface UseViewerInteractionsReturn {
  isDragging: boolean
  isPinching: boolean
  isWheeling: boolean
}

const createAnchor = (point: Point, getViewportCenter?: () => Point | null): ViewerTransformAnchor | null => {
  const viewportCenter = getViewportCenter?.()

  if (!viewportCenter)
    return null

  return {
    point,
    viewportCenter,
  }
}

export const useViewerInteractions = (options: UseViewerInteractionsOptions): UseViewerInteractionsReturn => {
  const {
    target,
    zoomTarget,
    enabled,
    enableDrag,
    enableZoom,
    enableKeyboard,
    enablePinch,
  } = options

  const callbacksRef = useRef(options)
  callbacksRef.current = options
  const activeRef = useRef(enabled)
  activeRef.current = enabled

  const drag = useDrag({
    target,
    enabled: enabled && enableDrag,
    onDrag: state => callbacksRef.current.onPan(state.delta),
  })

  const wheel = useWheel({
    target: zoomTarget ?? null,
    enabled: enabled && enableZoom,
    onWheel: (state) => {
      const anchor = createAnchor(
        state.center,
        callbacksRef.current.getViewportCenter,
      )
      if (anchor)
        callbacksRef.current.onWheelZoom(state.delta, anchor)
    },
  })

  const pinch = usePinch({
    target: zoomTarget ?? null,
    enabled: enabled && (enablePinch ?? enableZoom),
    onPinch: (state) => {
      const anchor = createAnchor(
        state.center,
        callbacksRef.current.getViewportCenter,
      )
      if (anchor)
        callbacksRef.current.onPinchZoom?.(state.deltaScale, anchor)
    },
  })

  // Dedicated double-click handler instead of piggy-backing on useDrag.filter.
  useEffect(() => {
    const el = zoomTarget
    if (!el)
      return

    const onDoubleClickHandler = (event: MouseEvent): void => {
      if (!activeRef.current)
        return
      const anchor = createAnchor(
        { x: event.clientX, y: event.clientY },
        callbacksRef.current.getViewportCenter,
      )
      if (anchor)
        callbacksRef.current.onDoubleClick(anchor)
    }

    el.addEventListener('dblclick', onDoubleClickHandler)
    return () => {
      el.removeEventListener('dblclick', onDoubleClickHandler)
    }
  }, [zoomTarget])

  // ESC is only bound while the viewer owns the active body portal.
  useEffect(() => {
    if (!(enabled && enableKeyboard))
      return

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape')
        callbacksRef.current.onEscape()
    }

    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [enabled, enableKeyboard])

  return {
    isDragging: drag.isDragging,
    isPinching: pinch.isPinching,
    isWheeling: wheel.isWheeling,
  }
}
