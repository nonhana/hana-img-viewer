import { act, renderHook } from '@testing-library/react'

import { useViewerTransform } from '@/hooks/viewer/useViewerTransform'

import { describe, expect, it } from '../support/vitest'

describe('useViewerTransform', () => {
  it('clamps setScale to minScale/maxScale bounds', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    act(() => result.current.setScale(100))
    expect(result.current.transform.scale).toBe(4)
    act(() => result.current.setScale(0.01))
    expect(result.current.transform.scale).toBe(0.5)
  })

  it('addScale increments scale by delta and clamps', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    act(() => result.current.addScale(0.5))
    expect(result.current.transform.scale).toBeCloseTo(1.5)
    act(() => result.current.addScale(10))
    expect(result.current.transform.scale).toBe(4)
  })

  it('multiplyScale scales by factor and clamps', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    act(() => result.current.multiplyScale(2))
    expect(result.current.transform.scale).toBe(2)
    act(() => result.current.multiplyScale(10))
    expect(result.current.transform.scale).toBe(4)
  })

  it('pan accumulates x/y deltas', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    act(() => result.current.pan({ x: 10, y: -5 }))
    act(() => result.current.pan({ x: 3, y: 7 }))
    expect(result.current.transform.x).toBe(13)
    expect(result.current.transform.y).toBe(2)
  })

  it('toggleDoubleClickZoom toggles between initial scale and target (2x default)', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    act(() => result.current.toggleDoubleClickZoom())
    expect(result.current.transform.scale).toBe(2)
    act(() => result.current.toggleDoubleClickZoom())
    expect(result.current.transform.scale).toBe(1)
  })

  it('reset zeroes pan and restores scale to default', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    act(() => result.current.pan({ x: 100, y: 50 }))
    act(() => result.current.setScale(2))
    act(() => result.current.reset())
    expect(result.current.transform).toEqual({ x: 0, y: 0, scale: 1 })
  })

  it('transformCss returns translate3d + scale CSS', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    act(() => result.current.pan({ x: 10, y: 20 }))
    act(() => result.current.setScale(1.5))
    expect(result.current.transformCss).toBe(
      'translate3d(10px, 20px, 0) scale(1.5)',
    )
  })

  it('canZoomIn/canZoomOut/isInitialZoom reflect scale state', () => {
    const { result } = renderHook(() =>
      useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 }),
    )
    expect(result.current.isInitialZoom).toBe(true)
    expect(result.current.canZoomIn).toBe(true)
    expect(result.current.canZoomOut).toBe(true)
    act(() => result.current.setScale(4))
    expect(result.current.canZoomIn).toBe(false)
    expect(result.current.canZoomOut).toBe(true)
    act(() => result.current.setScale(0.5))
    expect(result.current.canZoomIn).toBe(true)
    expect(result.current.canZoomOut).toBe(false)
  })
})
