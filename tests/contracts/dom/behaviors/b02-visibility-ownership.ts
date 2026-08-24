import type { DomAdapter } from '../adapter'
import { fireEvent } from '@testing-library/dom'
import { describe, expect, it } from 'vitest'
import { getPendingAnimationCount, resolvePendingAnimation, setAnimationSequence } from '../../../environment/dom.setup'

export const registerB2VisibilityOwnership = (adapter: DomAdapter) => {
  describe('[behavior/B2] visibility ownership and reversal', () => {
    it('waits for an external owner to confirm a close and does not echo sync', async () => {
      const viewer = await adapter.mount({
        src: 'thumb.jpg',
        visibility: { kind: 'external', open: true },
      })
      await viewer.settle()
      expect(viewer.getDialog()).not.toBeNull()

      fireEvent.click(viewer.getBackdrop()!)
      expect(viewer.requests).toEqual([false])
      expect(viewer.getDialog()).not.toBeNull()

      await viewer.confirmVisibility(false)
      await viewer.settle()
      expect(viewer.getDialog()).toBeNull()
      expect(viewer.requests).toEqual([false])
      viewer.unmount()
    })

    it('lets local ownership update itself from the same request seam', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      fireEvent.click(viewer.getTrigger()!)
      await viewer.settle()
      expect(viewer.getDialog()).not.toBeNull()
      expect(viewer.requests).toContain(true)

      fireEvent.click(viewer.getBackdrop()!)
      await viewer.settle()
      expect(viewer.getDialog()).toBeNull()
      expect(viewer.requests).toContain(false)
      viewer.unmount()
    })

    it('keeps the current session while opening and closing transitions reverse', async () => {
      setAnimationSequence(['pending', 'pending', 'pending', 'pending', 'pending', 'pending'])
      const viewer = await adapter.mount({
        src: 'thumb.jpg',
        visibility: { kind: 'external', open: true },
      })
      await viewer.settle()
      expect(getPendingAnimationCount()).toBeGreaterThan(0)

      await viewer.update({ visibility: { kind: 'external', open: false } })
      await viewer.update({ visibility: { kind: 'external', open: true } })
      expect(viewer.getDialog()).not.toBeNull()

      while (getPendingAnimationCount() > 0)
        resolvePendingAnimation()
      await viewer.settle()
      expect(viewer.getDialog()).not.toBeNull()
      viewer.unmount()
    })
  })
}
