import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Point } from '@/types/utils'
import { readonly, ref, toValue } from 'vue'
import { isClient, tryOnScopeDispose } from '@/utils/helpers'
import { getDistance, getMidpoint } from '@/utils/math'
import { useEventListener } from '@vueuse/core'

export interface PinchState {
  scale: number
  center: Point
  deltaScale: number
  distance: number
  isFirst: boolean
  isLast: boolean
  event: TouchEvent
}

export interface UsePinchOptions {
  target: MaybeRefOrGetter<EventTarget | null | undefined>
  enabled?: MaybeRefOrGetter<boolean>
  onPinchStart?: (state: PinchState) => void
  onPinch?: (state: PinchState) => void
  onPinchEnd?: (state: PinchState) => void
  preventDefault?: boolean
}

export interface UsePinchReturn {
  isPinching: Readonly<Ref<boolean>>
  scale: Readonly<Ref<number>>
  stop: () => void
}

export function usePinch(options: UsePinchOptions): UsePinchReturn {
  const {
    target,
    enabled = true,
    onPinchStart,
    onPinch,
    onPinchEnd,
    preventDefault = true,
  } = options

  const isPinching = ref(false)
  const scale = ref(1)

  let startDistance = 0
  let lastDistance = 0
  let rafId: number | null = null

  const cleanupFns: (() => void)[] = []

  const getTwoTouches = (touches: TouchList): [Touch, Touch] | null => {
    if (touches.length < 2)
      return null
    return [touches[0], touches[1]]
  }

  const getTouchMetrics = (touch1: Touch, touch2: Touch): { distance: number, center: Point } => {
    const p1: Point = { x: touch1.clientX, y: touch1.clientY }
    const p2: Point = { x: touch2.clientX, y: touch2.clientY }

    return {
      distance: getDistance(p1, p2),
      center: getMidpoint(p1, p2),
    }
  }

  const createPinchState = (
    event: TouchEvent,
    currentDistance: number,
    center: Point,
    isFirst: boolean,
    isLast: boolean,
  ): PinchState => {
    const currentScale = startDistance > 0 ? currentDistance / startDistance : 1
    const deltaScale = lastDistance > 0 ? currentDistance / lastDistance : 1

    return {
      scale: currentScale,
      center,
      deltaScale,
      distance: currentDistance,
      isFirst,
      isLast,
      event,
    }
  }

  const handleTouchStart = (event: TouchEvent): void => {
    if (!toValue(enabled))
      return

    const touches = getTwoTouches(event.touches)
    if (!touches)
      return

    if (preventDefault)
      event.preventDefault()

    const [touch1, touch2] = touches
    const { distance, center } = getTouchMetrics(touch1, touch2)

    startDistance = distance
    lastDistance = distance
    scale.value = 1

    isPinching.value = true

    const state = createPinchState(event, distance, center, true, false)
    onPinchStart?.(state)
  }

  const handleTouchEnd = (event: TouchEvent): void => {
    if (!isPinching.value)
      return

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    const center: Point = { x: 0, y: 0 }
    const state = createPinchState(event, lastDistance, center, false, true)

    onPinchEnd?.(state)

    isPinching.value = false
    startDistance = 0
    lastDistance = 0
  }

  const handleTouchMove = (event: TouchEvent): void => {
    if (!isPinching.value)
      return

    const touches = getTwoTouches(event.touches)
    if (!touches) {
      handleTouchEnd(event)
      return
    }

    if (preventDefault)
      event.preventDefault()

    if (rafId !== null)
      return

    rafId = requestAnimationFrame(() => {
      rafId = null

      const currentTouches = getTwoTouches(event.touches)
      if (!currentTouches)
        return

      const [touch1, touch2] = currentTouches
      const { distance, center } = getTouchMetrics(touch1, touch2)

      scale.value = startDistance > 0 ? distance / startDistance : 1

      const state = createPinchState(event, distance, center, false, false)
      onPinch?.(state)

      lastDistance = distance
    })
  }

  function setup(): void {
    if (!isClient)
      return

    cleanupFns.push(
      useEventListener(target, 'touchstart', evt => handleTouchStart(evt as TouchEvent), { passive: false }),
      useEventListener(target, 'touchmove', evt => handleTouchMove(evt as TouchEvent), { passive: false }),
      useEventListener(target, 'touchend', evt => handleTouchEnd(evt as TouchEvent)),
      useEventListener(target, 'touchcancel', evt => handleTouchEnd(evt as TouchEvent)),
    )
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

  const stop = (): void => {
    cleanup()
    isPinching.value = false
  }

  setup()

  tryOnScopeDispose(stop)

  return {
    isPinching: readonly(isPinching),
    scale: readonly(scale),
    stop,
  }
}
