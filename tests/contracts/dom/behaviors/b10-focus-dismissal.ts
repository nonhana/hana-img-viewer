import type { DomAdapter } from '../adapter'
import { describe, expect, it, vi } from 'vitest'

export const registerB10FocusDismissal = (adapter: DomAdapter) => {
  describe('[behavior/B10] keyboard, focus, and dismissal', () => {
    it('restores focus to the default trigger after Escape', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      const trigger = viewer.getTrigger()!
      trigger.focus()
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      viewer.getDialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await viewer.settle()
      expect(document.activeElement).toBe(trigger)
      viewer.unmount()
    })
    it('closes via the explicit close button and omits it when hidden', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const closeButton = viewer.getDialog()!.querySelector<HTMLButtonElement>('.hana-img-viewer-close-button')
      expect(closeButton).not.toBeNull()
      closeButton!.click()
      await viewer.settle()
      expect(viewer.getDialog()).toBeNull()

      const hidden = await adapter.mount({ src: 'hidden.jpg', showCloseButton: false })
      hidden.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await hidden.settle()
      expect(hidden.getDialog()!.querySelector('.hana-img-viewer-close-button')).toBeNull()
      hidden.unmount()
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
