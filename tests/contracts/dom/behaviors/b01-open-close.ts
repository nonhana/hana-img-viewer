import type { DomAdapter } from '../adapter'
import { fireEvent } from '@testing-library/dom'
import { describe, expect, it } from 'vitest'

export const registerB1OpenClose = (adapter: DomAdapter) => {
  describe('[behavior/B1] open and close lifecycle', () => {
    it('keeps origin-only markup before opening and restores it after dismissal', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      const trigger = viewer.getTrigger()

      expect(viewer.getOrigin()).not.toBeNull()
      expect(viewer.getDialog()).toBeNull()
      expect(trigger).not.toBeNull()

      fireEvent.click(trigger!)
      await viewer.settle()
      expect(viewer.getDialog()).not.toBeNull()
      expect(viewer.getOrigin()?.style.visibility).toBe('hidden')

      fireEvent.keyDown(viewer.getDialog()!, { key: 'Escape' })
      await viewer.settle()
      expect(viewer.getDialog()).toBeNull()
      expect(viewer.getOrigin()?.style.visibility).not.toBe('hidden')
      viewer.unmount()
    })

    it('opens from Enter and Space on the default trigger', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      const trigger = viewer.getTrigger()!

      fireEvent.keyDown(trigger, { key: 'Enter' })
      await viewer.settle()
      expect(viewer.getDialog()).not.toBeNull()
      fireEvent.keyDown(viewer.getDialog()!, { key: 'Escape' })
      await viewer.settle()

      fireEvent.keyDown(trigger, { key: ' ' })
      await viewer.settle()
      expect(viewer.getDialog()).not.toBeNull()
      viewer.unmount()
    })
  })
}
