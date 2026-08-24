import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'

export const registerB12BodyLock = (adapter: DomAdapter) => {
  describe('[behavior/B12] body scroll lock', () => {
    it('reference-counts body owners and preserves a host write after final cleanup', async () => {
      const first = await adapter.mount({ src: 'one.jpg' })
      const second = await adapter.mount({ src: 'two.jpg' })
      first.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      second.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await first.settle()
      await second.settle()
      expect(document.body.style.overflow).toBe('hidden')

      first.getBackdrop()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await first.settle()
      expect(document.body.style.overflow).toBe('hidden')

      document.body.style.overflow = 'clip'
      second.getBackdrop()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await second.settle()
      expect(document.body.style.overflow).toBe('clip')
      first.unmount()
      second.unmount()
    })

    it('never locks the body for custom or pending targets', async () => {
      const host = document.createElement('section')
      document.body.append(host)
      const custom = await adapter.mount({ src: 'custom.jpg', container: { kind: 'custom', element: host } })
      custom.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await custom.settle()
      expect(document.body.style.overflow).toBe('')
      custom.unmount()

      const pending = await adapter.mount({ src: 'pending.jpg', container: { kind: 'pending' } })
      pending.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await pending.settle()
      expect(document.body.style.overflow).toBe('')
      pending.unmount()
    })
  })
}
