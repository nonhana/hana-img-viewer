import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Point } from '@/types/utils'
import { readonly, ref, toValue } from 'vue'
import { useEventListener } from '@/composables/utils/useEventListener'
import { isClient, tryOnScopeDispose } from '@/utils/helpers'

export interface DragState {
  offset: Point
  delta: Point
  position: Point
  isFirst: boolean
  isLast: boolean
  event: PointerEvent
}

export interface UseDragOptions {
  target: MaybeRefOrGetter<HTMLElement | null | undefined>
  enabled?: MaybeRefOrGetter<boolean>
  filter?: (event: PointerEvent) => boolean
  onDragStart?: (state: DragState) => void
  onDrag?: (state: DragState) => void
  onDragEnd?: (state: DragState) => void
  preventDefault?: boolean
  stopPropagation?: boolean
  pointerTypes?: ('mouse' | 'touch' | 'pen')[]
}

export interface UseDragReturn {
  isDragging: Readonly<Ref<boolean>>
  offset: Readonly<Ref<Point>>
  cancel: () => void
  stop: () => void
}

export function useDrag(options: UseDragOptions): UseDragReturn {
  const {
    target,
    enabled = true,
    filter,
    onDragStart,
    onDrag,
    onDragEnd,
    preventDefault = true,
    stopPropagation = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
  } = options

  const isDragging = ref(false)
  const offset = ref<Point>({ x: 0, y: 0 })

  let startPos: Point = { x: 0, y: 0 }
  let lastPos: Point = { x: 0, y: 0 }
  let activePointerId: number | null = null
  let rafId: number | null = null

  const cleanupFns: (() => void)[] = []

  const isAllowedPointerType = (type: string): boolean => {
    return pointerTypes.includes(type as 'mouse' | 'touch' | 'pen')
  }

  const createDragState = (
    event: PointerEvent,
    isFirst: boolean,
    isLast: boolean,
  ): DragState => {
    const position = { x: event.clientX, y: event.clientY }
    const currentOffset = {
      x: position.x - startPos.x,
      y: position.y - startPos.y,
    }
    const delta = {
      x: position.x - lastPos.x,
      y: position.y - lastPos.y,
    }

    return {
      offset: currentOffset,
      delta,
      position,
      isFirst,
      isLast,
      event,
    }
  }

  const handlePointerDown = (event: PointerEvent): void => {
    if (!toValue(enabled))
      return

    if (!isAllowedPointerType(event.pointerType))
      return

    if (activePointerId !== null)
      return

    if (filter && !filter(event))
      return

    if (preventDefault)
      event.preventDefault()
    if (stopPropagation)
      event.stopPropagation()

    const el = toValue(target)
    if (!el)
      return

    el.setPointerCapture(event.pointerId)
    activePointerId = event.pointerId

    startPos = { x: event.clientX, y: event.clientY }
    lastPos = { ...startPos }
    offset.value = { x: 0, y: 0 }

    isDragging.value = true

    const state = createDragState(event, true, false)
    onDragStart?.(state)
  }

  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId)
      return

    if (!isDragging.value)
      return

    if (preventDefault)
      event.preventDefault()

    if (rafId !== null)
      return

    rafId = requestAnimationFrame(() => {
      rafId = null

      const state = createDragState(event, false, false)

      offset.value = state.offset

      lastPos = state.position

      onDrag?.(state)
    })
  }

  const handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId)
      return

    if (!isDragging.value)
      return

    const el = toValue(target)
    if (el) {
      el.releasePointerCapture(event.pointerId)
    }

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    const state = createDragState(event, false, true)
    onDragEnd?.(state)

    isDragging.value = false
    activePointerId = null
  }

  const handlePointerCancel = (event: PointerEvent): void => {
    handlePointerUp(event)
  }

  const setup = (): void => {
    if (!isClient)
      return

    const { stop: stopPointerDown } = useEventListener(
      target,
      'pointerdown',
      handlePointerDown,
    )
    cleanupFns.push(stopPointerDown)

    const { stop: stopPointerMove } = useEventListener(
      target,
      'pointermove',
      handlePointerMove,
    )
    cleanupFns.push(stopPointerMove)

    const { stop: stopPointerUp } = useEventListener(
      target,
      'pointerup',
      handlePointerUp,
    )
    cleanupFns.push(stopPointerUp)

    const { stop: stopPointerCancel } = useEventListener(
      target,
      'pointercancel',
      handlePointerCancel,
    )
    cleanupFns.push(stopPointerCancel)
  }

  const cleanup = (): void => {
    for (const fn of cleanupFns) {
      fn()
    }
    cleanupFns.length = 0

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  const cancel = (): void => {
    if (!isDragging.value)
      return

    const el = toValue(target)
    if (el && activePointerId !== null) {
      try {
        el.releasePointerCapture(activePointerId)
      }
      catch {
      }
    }

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    isDragging.value = false
    activePointerId = null
  }

  const stop = (): void => {
    cancel()
    cleanup()
  }

  setup()

  tryOnScopeDispose(stop)

  return {
    isDragging: readonly(isDragging),
    offset: readonly(offset),
    cancel,
    stop,
  }
}
