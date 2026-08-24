import type { DomAdapter } from '../adapter'
import { describe, expect, it, vi } from 'vitest'

export const registerB10FocusDismissal = (adapter: DomAdapter) => {
  describe('[behavior/B10] keyboard, focus, and dismissal', () => {
    it('restores the exact custom opener after Escape', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg', trigger: 'custom' })
      const opener = viewer.getTrigger()!
      opener.focus()
      opener.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      viewer.getDialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await viewer.settle()
      expect(document.activeElement).toBe(opener)
      viewer.unmount()
    })

    it('closes only the focused overlay and keeps disabled paths available to the host', async () => {
      const first = await adapter.mount({ src: 'one.jpg' })
      const second = await adapter.mount({ src: 'two.jpg' })
      first.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      second.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await first.settle()
      await second.settle()
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]')
      expect(dialogs).toHaveLength(2)
      dialogs[1]?.focus()
      dialogs[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await second.settle()
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1)
      first.unmount()
      second.unmount()

      const host = document.createElement('section')
      const hostClick = vi.fn()
      const hostKeydown = vi.fn()
      host.addEventListener('click', hostClick)
      host.addEventListener('keydown', hostKeydown)
      document.body.append(host)
      const disabled = await adapter.mount({
        src: 'disabled.jpg',
        container: { kind: 'custom', element: host },
        closeOnBackdropClick: false,
        closeOnEscape: false,
      })
      disabled.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await disabled.settle()
      disabled.getBackdrop()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      disabled.getDialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(disabled.getDialog()).not.toBeNull()
      expect(hostClick).toHaveBeenCalledOnce()
      expect(hostKeydown).toHaveBeenCalledOnce()
      disabled.unmount()
    })
  })
}
