import type { MaybeRefOrGetter } from 'vue'
import type { Point, ViewerTransformAnchor } from '@/types'
import { useEventListener } from '@vueuse/core'
import { computed, toValue } from 'vue'
import { useDrag, usePinch, useWheel } from '@/composables/core'

export interface UseViewerInteractionsOptions {
  target: MaybeRefOrGetter<HTMLElement | null | undefined>
  zoomTarget?: MaybeRefOrGetter<HTMLElement | null | undefined>
  enabled: MaybeRefOrGetter<boolean>
  enableDrag: MaybeRefOrGetter<boolean>
  enableZoom: MaybeRefOrGetter<boolean>
  enableKeyboard: MaybeRefOrGetter<boolean>
  enablePinch?: MaybeRefOrGetter<boolean>
  onPan: (delta: Point) => void
  onWheelZoom: (delta: number, anchor: ViewerTransformAnchor) => void
  onPinchZoom?: (scaleDelta: number, anchor: ViewerTransformAnchor) => void
  onDoubleClick: (anchor: ViewerTransformAnchor) => void
  onEscape: () => void
  getViewportCenter?: () => Point | null
}

function createAnchor(point: Point, getViewportCenter?: () => Point | null): ViewerTransformAnchor | null {
  const viewportCenter = getViewportCenter?.()

  if (!viewportCenter)
    return null

  return {
    point,
    viewportCenter,
  }
}

export function useViewerInteractions(options: UseViewerInteractionsOptions) {
  const active = computed(() => toValue(options.enabled))
  const zoomTarget = computed(() => toValue(options.zoomTarget ?? options.target))
  const enablePinch = options.enablePinch ?? options.enableZoom

  const drag = useDrag({
    target: options.target,
    enabled: () => active.value && toValue(options.enableDrag),
    onDrag: state => options.onPan(state.delta),
  })

  const wheel = useWheel({
    target: zoomTarget,
    enabled: () => active.value && toValue(options.enableZoom),
    onWheel: (state) => {
      const anchor = createAnchor(state.center, options.getViewportCenter)
      if (anchor)
        options.onWheelZoom(state.delta, anchor)
    },
  })

  const pinch = usePinch({
    target: zoomTarget,
    enabled: () => active.value && toValue(enablePinch),
    onPinch: (state) => {
      const anchor = createAnchor(state.center, options.getViewportCenter)
      if (anchor)
        options.onPinchZoom?.(state.deltaScale, anchor)
    },
  })

  // Dedicated double-click handler instead of piggy-backing on useDrag.filter
  useEventListener(
    zoomTarget,
    'dblclick',
    (event: MouseEvent) => {
      if (!active.value)
        return
      const anchor = createAnchor(
        { x: event.clientX, y: event.clientY },
        options.getViewportCenter,
      )
      if (anchor)
        options.onDoubleClick(anchor)
    },
  )

  useEventListener(
    () => active.value && toValue(options.enableKeyboard) ? window : null,
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key === 'Escape')
        options.onEscape()
    },
  )

  return {
    isDragging: drag.isDragging,
    isPinching: pinch.isPinching,
    isWheeling: wheel.isWheeling,
  }
}
