import type { Point, WheelState } from 'hana-img-viewer-core'
import {
  createTrackpadDetector,

} from 'hana-img-viewer-core'

import { useEffect, useRef, useState } from 'react'

import { isClient } from '@/utils/helpers'

export interface UseWheelOptions {
  target: EventTarget | null
  enabled?: boolean
  onWheel?: (state: WheelState) => void
  mouseSensitivity?: number
  trackpadSensitivity?: number
  zoomRatio?: number
  preventDefault?: boolean
}

export interface UseWheelReturn {
  isWheeling: boolean
  stop: () => void
}

export const useWheel = (options: UseWheelOptions): UseWheelReturn => {
  const {
    target,
    enabled = true,
    onWheel,
    mouseSensitivity = 0.002,
    trackpadSensitivity = 0.01,
    zoomRatio = 1,
    preventDefault = true,
  } = options

  const [isWheeling, setIsWheeling] = useState(false)

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const configRef = useRef({
    onWheel,
    mouseSensitivity,
    trackpadSensitivity,
    zoomRatio,
    preventDefault,
  })
  configRef.current = {
    onWheel,
    mouseSensitivity,
    trackpadSensitivity,
    zoomRatio,
    preventDefault,
  }
  const detectorRef = useRef(createTrackpadDetector())
  const rafIdRef = useRef<number | null>(null)
  const wheelEndTimerRef = useRef<number | undefined>(undefined)

  const handleWheel = (event: WheelEvent): void => {
    if (!enabledRef.current)
      return

    const config = configRef.current

    if (config.preventDefault)
      event.preventDefault()

    setIsWheeling(true)

    clearTimeout(wheelEndTimerRef.current)

    wheelEndTimerRef.current = window.setTimeout(() => {
      setIsWheeling(false)
      detectorRef.current.reset()
    }, 150)

    if (rafIdRef.current !== null)
      return

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null

      const isTrackpad = detectorRef.current.detect(event)

      const sensitivity = isTrackpad
        ? config.trackpadSensitivity
        : config.mouseSensitivity

      const delta = -event.deltaY * sensitivity * config.zoomRatio

      const center: Point = {
        x: event.clientX,
        y: event.clientY,
      }

      config.onWheel?.({
        delta,
        center,
        isTrackpad,
        event,
      })
    })
  }

  useEffect(() => {
    if (!isClient)
      return

    const el = target
    if (!el)
      return

    const wheelHandler = (event: Event): void => {
      handleWheel(event as WheelEvent)
    }

    el.addEventListener('wheel', wheelHandler, { passive: false })

    const detector = detectorRef.current

    return () => {
      el.removeEventListener('wheel', wheelHandler)

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      if (wheelEndTimerRef.current !== undefined) {
        clearTimeout(wheelEndTimerRef.current)
        wheelEndTimerRef.current = undefined
      }

      detector.reset()
      setIsWheeling(false)
    }
  }, [target])

  const stop = (): void => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    if (wheelEndTimerRef.current !== undefined) {
      clearTimeout(wheelEndTimerRef.current)
      wheelEndTimerRef.current = undefined
    }

    detectorRef.current.reset()
    setIsWheeling(false)
  }

  return {
    isWheeling,
    stop,
  }
}

export type { WheelState }
