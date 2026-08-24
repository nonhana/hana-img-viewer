import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'
import { createPointerEvent, createTouchEvent } from '../../../environment/dom.setup'

export const registerB4PinchOwnership = (adapter: DomAdapter) => {
  describe('[behavior/B4] pinch ownership', () => {
    it('hands ownership from pointer drag to two-touch pinch', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      const trigger = viewer.getTrigger()!
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const preview = viewer.getPreview()!

      preview.dispatchEvent(createPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
        pointerId: 1,
      }))
      preview.dispatchEvent(createTouchEvent('touchstart', [
        { clientX: 0, clientY: 0 },
        { clientX: 10, clientY: 0 },
      ]))
      preview.dispatchEvent(createTouchEvent('touchmove', [
        { clientX: 0, clientY: 0 },
        { clientX: 20, clientY: 0 },
      ]))
      await viewer.settle()

      expect(preview.style.transform).toContain('scale(2)')
      viewer.unmount()
    })
  })
}
