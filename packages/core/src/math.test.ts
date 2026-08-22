import { describe, expect, it } from 'vitest'
import { clamp, getDistance, getMidpoint, getZoomAnchoredPosition } from './math'

describe('getDistance', () => {
  it('computes euclidean distance', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('returns 0 for identical points', () => {
    expect(getDistance({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(0)
  })
})

describe('getMidpoint', () => {
  it('computes the midpoint', () => {
    expect(getMidpoint({ x: 2, y: 4 }, { x: 6, y: 8 })).toEqual({ x: 4, y: 6 })
  })

  it('handles negative coordinates', () => {
    expect(getMidpoint({ x: -2, y: -4 }, { x: 6, y: 8 })).toEqual({ x: 2, y: 2 })
  })
})

describe('getZoomAnchoredPosition', () => {
  it('keeps the anchor position stationary when current position is at the anchor', () => {
    // viewportCenter 缺省 (0,0)，current === anchor → 缩放后位置不变
    const anchor = { x: 30, y: 40 }
    const result = getZoomAnchoredPosition(anchor, anchor, 1, 2)
    expect(result).toEqual(anchor)
  })

  it('zooms from the given viewport center', () => {
    const viewportCenter = { x: 0, y: 0 }
    const result = getZoomAnchoredPosition({ x: 10, y: 20 }, { x: 30, y: 40 }, 1, 2, viewportCenter)
    expect(result).toEqual({ x: -10, y: 0 })
  })

  it('falls back to (0, 0) center in a non-browser environment (SSR)', () => {
    // No window global: `viewportCenter` defaults to (0, 0)
    const result = getZoomAnchoredPosition({ x: 10, y: 20 }, { x: 30, y: 40 }, 1, 2)
    expect(result).toEqual({ x: -10, y: 0 })
  })

  it('supports zooming out', () => {
    const viewportCenter = { x: 0, y: 0 }
    const result = getZoomAnchoredPosition({ x: 10, y: 20 }, { x: 30, y: 40 }, 2, 1, viewportCenter)
    expect(result).toEqual({ x: 20, y: 30 })
  })
})
describe('clamp', () => {
  it('clamps within the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})
