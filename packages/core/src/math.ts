import type { Point } from './types'

export const getDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.hypot(dx, dy)
}

export const getMidpoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

export const getZoomAnchoredPosition = (currentPos: Point, anchor: Point, currentScale: number, newScale: number, viewportCenter?: Point): Point => {
  const ratio = newScale / currentScale

  const center = viewportCenter ?? {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  }

  const anchorOffset = {
    x: anchor.x - center.x,
    y: anchor.y - center.y,
  }

  return {
    x: anchorOffset.x * (1 - ratio) + currentPos.x * ratio,
    y: anchorOffset.y * (1 - ratio) + currentPos.y * ratio,
  }
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}
