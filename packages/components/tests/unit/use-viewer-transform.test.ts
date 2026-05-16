import { effectScope } from 'vue'
import { useViewerTransform } from '@/composables/viewer/useViewerTransform'
import { describe, expect, it } from '../support/vitest'

function withScope<T>(fn: () => T): T {
  const scope = effectScope()
  try {
    return scope.run(fn) as T
  }
  finally {
    scope.stop()
  }
}

describe('useViewerTransform', () => {
  it('clamps setScale to minScale/maxScale bounds', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      t.setScale(100)
      expect(t.transform.value.scale).toBe(4)
      t.setScale(0.01)
      expect(t.transform.value.scale).toBe(0.5)
    })
  })

  it('addScale increments scale by delta and clamps', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      t.addScale(0.5)
      expect(t.transform.value.scale).toBeCloseTo(1.5)
      t.addScale(10)
      expect(t.transform.value.scale).toBe(4)
    })
  })

  it('multiplyScale scales by factor and clamps', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      t.multiplyScale(2)
      expect(t.transform.value.scale).toBe(2)
      t.multiplyScale(10)
      expect(t.transform.value.scale).toBe(4)
    })
  })

  it('pan accumulates x/y deltas', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      t.pan({ x: 10, y: -5 })
      t.pan({ x: 3, y: 7 })
      expect(t.transform.value.x).toBe(13)
      expect(t.transform.value.y).toBe(2)
    })
  })

  it('toggleDoubleClickZoom toggles between initial scale and target (2x default)', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      t.toggleDoubleClickZoom()
      expect(t.transform.value.scale).toBe(2)
      t.toggleDoubleClickZoom()
      expect(t.transform.value.scale).toBe(1)
    })
  })

  it('reset zeroes pan and restores scale to default', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      t.pan({ x: 100, y: 50 })
      t.setScale(2)
      t.reset()
      expect(t.transform.value).toEqual({ x: 0, y: 0, scale: 1 })
    })
  })

  it('transformCss returns translate3d + scale CSS', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      t.pan({ x: 10, y: 20 })
      t.setScale(1.5)
      expect(t.transformCss.value).toBe('translate3d(10px, 20px, 0) scale(1.5)')
    })
  })

  it('canZoomIn/canZoomOut/isInitialZoom reflect scale state', () => {
    withScope(() => {
      const t = useViewerTransform({ minScale: () => 0.5, maxScale: () => 4 })
      expect(t.isInitialZoom.value).toBe(true)
      expect(t.canZoomIn.value).toBe(true)
      expect(t.canZoomOut.value).toBe(true)
      t.setScale(4)
      expect(t.canZoomIn.value).toBe(false)
      expect(t.canZoomOut.value).toBe(true)
      t.setScale(0.5)
      expect(t.canZoomIn.value).toBe(true)
      expect(t.canZoomOut.value).toBe(false)
    })
  })
})
