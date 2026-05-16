import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Point } from '@/types/utils'
import { readonly, ref, toValue } from 'vue'
import { isClient, tryOnScopeDispose } from '@/utils/helpers'
import { useEventListener } from '@vueuse/core'

export interface WheelState {
  delta: number
  center: Point
  isTrackpad: boolean
  event: WheelEvent
}

export interface UseWheelOptions {
  target: MaybeRefOrGetter<EventTarget | null | undefined>
  enabled?: MaybeRefOrGetter<boolean>
  onWheel?: (state: WheelState) => void
  mouseSensitivity?: number
  trackpadSensitivity?: number
  zoomRatio?: MaybeRefOrGetter<number>
  preventDefault?: boolean
}

export interface UseWheelReturn {
  isWheeling: Readonly<Ref<boolean>>
  stop: () => void
}

function createTrackpadDetector() {
  let lastWheelTime = 0
  let consecutiveSmallDeltas = 0

  function detect(event: WheelEvent): boolean {
    const now = Date.now()
    const timeDelta = now - lastWheelTime
    lastWheelTime = now

    const absY = Math.abs(event.deltaY)

    if (absY % 1 !== 0) {
      consecutiveSmallDeltas++
      return true
    }

    if (timeDelta < 50 && absY < 50) {
      consecutiveSmallDeltas++
      if (consecutiveSmallDeltas > 2)
        return true
    }
    else {
      consecutiveSmallDeltas = 0
    }

    if (event.deltaMode === 0 && absY < 100)
      return true

    return false
  }

  function reset(): void {
    lastWheelTime = 0
    consecutiveSmallDeltas = 0
  }

  return { detect, reset }
}

export function useWheel(options: UseWheelOptions): UseWheelReturn {
  const {
    target,
    enabled = true,
    onWheel,
    mouseSensitivity = 0.002,
    trackpadSensitivity = 0.01,
    zoomRatio = 1,
    preventDefault = true,
  } = options

  const isWheeling = ref(false)

  const detector = createTrackpadDetector()
  let rafId: number | null = null
  let wheelEndTimer: ReturnType<typeof setTimeout> | null = null

  const cleanupFns: (() => void)[] = []

  const handleWheel = (event: WheelEvent): void => {
    if (!toValue(enabled))
      return

    if (preventDefault)
      event.preventDefault()

    isWheeling.value = true

    if (wheelEndTimer !== null) {
      clearTimeout(wheelEndTimer)
    }

    wheelEndTimer = setTimeout(() => {
      isWheeling.value = false
      detector.reset()
    }, 150)

    if (rafId !== null)
      return

    rafId = requestAnimationFrame(() => {
      rafId = null

      const isTrackpad = detector.detect(event)

      const sensitivity = isTrackpad ? trackpadSensitivity : mouseSensitivity

      const delta = -event.deltaY * sensitivity * toValue(zoomRatio)

      const center: Point = {
        x: event.clientX,
        y: event.clientY,
      }

      const state: WheelState = {
        delta,
        center,
        isTrackpad,
        event,
      }
      onWheel?.(state)
    })
  }

  function setup(): void {
    if (!isClient)
      return

    cleanupFns.push(
      useEventListener(target, 'wheel', evt => handleWheel(evt as WheelEvent), { passive: false }),
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

    if (wheelEndTimer !== null) {
      clearTimeout(wheelEndTimer)
      wheelEndTimer = null
    }

    detector.reset()
  }

  const stop = (): void => {
    cleanup()
    isWheeling.value = false
  }

  setup()

  tryOnScopeDispose(stop)

  return {
    isWheeling: readonly(isWheeling),
    stop,
  }
}
