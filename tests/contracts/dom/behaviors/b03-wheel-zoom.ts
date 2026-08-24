import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'
import { setSelectorClientSize, setSelectorRect, triggerResizeObservers } from '../../../environment/dom.setup'

export const registerB3WheelZoom = (adapter: DomAdapter) => {
  describe('[behavior/B3] wheel and trackpad zoom', () => {
    it('anchors an off-center wheel zoom in a custom container and preserves it after remeasure', async () => {
      const host = document.createElement('section')
      document.body.append(host)
      setSelectorRect('.hana-img-viewer-overlay', { x: 100, y: 50, width: 400, height: 300 })
      setSelectorClientSize('.hana-img-viewer-overlay', { width: 800, height: 600 })
      const viewer = await adapter.mount({
        src: 'thumb.jpg',
        container: { kind: 'custom', element: host },
      })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()

      const preview = viewer.getPreview()!
      preview.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaMode: 1,
        deltaY: -100,
        clientX: 200,
        clientY: 120,
      }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(1.2)')
      expect(preview.style.transform).not.toContain('translate3d(0px, 0px')
      const transform = preview.style.transform

      triggerResizeObservers()
      await viewer.settle()
      expect(preview.style.transform).toBe(transform)
      viewer.unmount()
    })

    it('clamps both wheel bounds without losing the active transform', async () => {
      const viewer = await adapter.mount({
        src: 'thumb.jpg',
        minZoom: 0.5,
        maxZoom: 1.5,
      })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const preview = viewer.getPreview()!

      preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaMode: 1, deltaY: -1000, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(1.5)')
      preview.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaMode: 1, deltaY: 1000, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(0.5)')
      viewer.unmount()
    })
  })
}
