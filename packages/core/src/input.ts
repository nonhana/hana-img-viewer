import type { PinchState, Point } from './types'

import { getDistance, getMidpoint } from './math'

export interface TrackpadDetector {
  detect: (event: WheelEvent) => boolean
  reset: () => void
}

export const createTrackpadDetector = (): TrackpadDetector => {
  let lastWheelTime = 0
  let consecutiveSmallDeltas = 0

  const detect = (event: WheelEvent): boolean => {
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

  const reset = (): void => {
    lastWheelTime = 0
    consecutiveSmallDeltas = 0
  }

  return { detect, reset }
}

export const getTwoTouches = (touches: TouchList): [Touch, Touch] | null => {
  if (touches.length < 2)
    return null
  return [touches[0], touches[1]]
}

export const getTouchMetrics = (touch1: Touch, touch2: Touch): { distance: number, center: Point } => {
  const p1: Point = { x: touch1.clientX, y: touch1.clientY }
  const p2: Point = { x: touch2.clientX, y: touch2.clientY }

  return {
    distance: getDistance(p1, p2),
    center: getMidpoint(p1, p2),
  }
}

export const createPinchState = (event: TouchEvent, currentDistance: number, center: Point, isFirst: boolean, isLast: boolean, startDistance: number, lastDistance: number): PinchState => {
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
