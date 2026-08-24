import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'
import { createPointerEvent, setSelectorClientSize, triggerResizeObservers } from '../../../environment/dom.setup'

const dispatchDrag = (preview: HTMLElement, pointerId: number, from: [number, number], to: [number, number]) => {
  preview.dispatchEvent(createPointerEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    clientX: from[0],
    clientY: from[1],
    pointerId,
  }))
  preview.dispatchEvent(createPointerEvent('pointermove', {
    bubbles: true,
    cancelable: true,
    clientX: to[0],
    clientY: to[1],
    pointerId,
  }))
  preview.dispatchEvent(createPointerEvent('pointerup', {
    bubbles: true,
    cancelable: true,
    clientX: to[0],
    clientY: to[1],
    pointerId,
  }))
}

export const registerB5PointerDrag = (adapter: DomAdapter) => {
  describe('[behavior/B5] pointer drag', () => {
    it('pans at baseline and below-baseline scale, including across remeasurement', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const preview = viewer.getPreview()!

      dispatchDrag(preview, 1, [10, 10], [30, 35])
      await viewer.settle()
      expect(preview.style.transform).toContain('translate3d(20px, 25px')

      preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaMode: 1, deltaY: 100, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(0.8)')
      const beforeResize = preview.style.transform
      setSelectorClientSize('.hana-img-viewer-overlay', { width: 800, height: 600 })
      triggerResizeObservers()
      await viewer.settle()
      expect(preview.style.transform).toBe(beforeResize)

      dispatchDrag(preview, 2, [10, 10], [30, 35])
      await viewer.settle()
      expect(preview.style.transform).not.toBe(beforeResize)
      viewer.unmount()
    })

    it('does not install transform gestures when zoom is disabled', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg', enableZoom: false })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const preview = viewer.getPreview()!
      const initialTransform = preview.style.transform
      preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100, clientX: 100, clientY: 100 }))
      preview.dispatchEvent(createPointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 0, clientY: 0, pointerId: 1 }))
      preview.dispatchEvent(createPointerEvent('pointermove', { bubbles: true, cancelable: true, clientX: 20, clientY: 20, pointerId: 1 }))
      await viewer.settle()
      expect(preview.style.transform).toBe(initialTransform)
      viewer.unmount()
    })

    it('preserves translation when a dynamic bound clamps the scale', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const preview = viewer.getPreview()!
      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      dispatchDrag(preview, 1, [100, 100], [300, 250])
      await viewer.settle()
      const translation = preview.style.transform.split(' scale(')[0]

      await viewer.update({ maxZoom: 1 })
      await viewer.settle()
      expect(preview.style.transform).toBe(`${translation} scale(1)`)
      viewer.unmount()
    })
  })
}
