import type { PinchState, Point } from 'hana-img-viewer-core'
import {
  createPinchState,
  getTouchMetrics,
  getTwoTouches,

} from 'hana-img-viewer-core'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { isClient } from '@/utils/helpers'

export interface UsePinchOptions {
  target: EventTarget | null
  enabled?: boolean
  onPinchStart?: (state: PinchState) => void
  onPinch?: (state: PinchState) => void
  onPinchEnd?: (state: PinchState) => void
  preventDefault?: boolean
}

export interface UsePinchReturn {
  isPinching: boolean
  scale: number
  stop: () => void
}

export const usePinch = (options: UsePinchOptions): UsePinchReturn => {
  const {
    target,
    enabled = true,
    onPinchStart,
    onPinch,
    onPinchEnd,
    preventDefault = true,
  } = options

  const [isPinching, setIsPinching] = useState(false)
  const [scale, setScale] = useState(1)

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const configRef = useRef({
    onPinchStart,
    onPinch,
    onPinchEnd,
    preventDefault,
  })
  configRef.current = { onPinchStart, onPinch, onPinchEnd, preventDefault }
  const pinchStateRef = useRef({ startDistance: 0, lastDistance: 0 })
  const rafIdRef = useRef<number | null>(null)

  const handleTouchStart = (event: TouchEvent): void => {
    if (!enabledRef.current)
      return

    const touches = getTwoTouches(event.touches)
    if (!touches)
      return

    const config = configRef.current

    if (config.preventDefault)
      event.preventDefault()

    const [touch1, touch2] = touches
    const { distance, center } = getTouchMetrics(touch1, touch2)

    pinchStateRef.current.startDistance = distance
    pinchStateRef.current.lastDistance = distance
    setScale(1)

    setIsPinching(true)

    config.onPinchStart?.(
      createPinchState(
        event,
        distance,
        center,
        true,
        false,
        pinchStateRef.current.startDistance,
        pinchStateRef.current.lastDistance,
      ),
    )
  }

  const handleTouchEnd = (event: TouchEvent): void => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    const center: Point = { x: 0, y: 0 }
    const state = createPinchState(
      event,
      pinchStateRef.current.lastDistance,
      center,
      false,
      true,
      pinchStateRef.current.startDistance,
      pinchStateRef.current.lastDistance,
    )

    configRef.current.onPinchEnd?.(state)

    setIsPinching(false)
    pinchStateRef.current.startDistance = 0
    pinchStateRef.current.lastDistance = 0
  }

  const handleTouchMove = (event: TouchEvent): void => {
    if (rafIdRef.current !== null)
      return

    const touches = getTwoTouches(event.touches)
    if (!touches) {
      handleTouchEnd(event)
      return
    }

    const config = configRef.current

    if (config.preventDefault)
      event.preventDefault()

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null

      const currentTouches = getTwoTouches(event.touches)
      if (!currentTouches)
        return

      const [touch1, touch2] = currentTouches
      const { distance, center } = getTouchMetrics(touch1, touch2)

      setScale(
        pinchStateRef.current.startDistance > 0
          ? distance / pinchStateRef.current.startDistance
          : 1,
      )

      config.onPinch?.(
        createPinchState(
          event,
          distance,
          center,
          false,
          false,
          pinchStateRef.current.startDistance,
          pinchStateRef.current.lastDistance,
        ),
      )

      pinchStateRef.current.lastDistance = distance
    })
  }

  const handleTouchMoveEvent = useEffectEvent(handleTouchMove)

  useEffect(() => {
    if (!isClient)
      return

    const el = target
    if (!el)
      return

    const onTouchStart = (event: Event): void => {
      handleTouchStart(event as TouchEvent)
    }
    const onTouchMove = (event: Event): void => {
      handleTouchMoveEvent(event as TouchEvent)
    }
    const onTouchEnd = (event: Event): void => {
      handleTouchEnd(event as TouchEvent)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    const stateRef = pinchStateRef
    const rafRef = rafIdRef

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      setIsPinching(false)
      stateRef.current.startDistance = 0
      stateRef.current.lastDistance = 0
    }
  }, [target])

  const stop = (): void => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    setIsPinching(false)
    pinchStateRef.current.startDistance = 0
    pinchStateRef.current.lastDistance = 0
  }

  return {
    isPinching,
    scale,
    stop,
  }
}

export type { PinchState }
