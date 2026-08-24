import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'

export const registerB6DoubleClickReset = (adapter: DomAdapter) => {
  describe('[behavior/B6] double-click baseline reset', () => {
    it('toggles default, above-one, and below-one ranges back to baseline one', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const preview = viewer.getPreview()!

      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(2)')
      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toBe('translate3d(0px, 0px, 0) scale(1)')

      await viewer.update({ minZoom: 1.5, maxZoom: 3 })
      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(2)')
      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(1)')

      await viewer.update({ minZoom: 0.5, maxZoom: 0.75 })
      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(0.75)')
      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toBe('translate3d(0px, 0px, 0) scale(1)')
      viewer.unmount()
    })
  })
}
