import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'

export const registerB15NativeAttributes = (adapter: DomAdapter) => {
  describe('[behavior/B15] native img attributes', () => {
    it('applies caller class and style to the native img trigger and falls unknown attributes through', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg', imgClass: 'h-10 rounded-xl', imgStyle: { borderRadius: '4px' }, imgAttributes: { 'data-testid': 'cover', 'aria-label': 'Cover artwork' } })
      const trigger = viewer.getTrigger() as HTMLImageElement

      expect(trigger.tagName).toBe('IMG')
      expect(trigger.getAttribute('data-testid')).toBe('cover')
      expect(trigger.getAttribute('aria-label')).toBe('Cover artwork')
      expect(trigger.style.getPropertyValue('border-radius')).toBe('4px')
      expect(trigger.classList.contains('hana-img-viewer-thumbnail')).toBe(true)
      expect(trigger.classList.contains('h-10')).toBe(true)

      expect(trigger.getAttribute('role')).toBe('button')
      expect(trigger.getAttribute('tabindex')).toBe('0')
      viewer.unmount()
    })

    it('renders the built-in-only trigger without caller attributes', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      const trigger = viewer.getTrigger()!

      expect([...trigger.classList]).toEqual(['hana-img-viewer-thumbnail'])
      expect(trigger.getAttribute('data-testid')).toBeNull()
      viewer.unmount()
    })

    it('replaces caller class on update', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg', imgClass: 'first-class' })
      await viewer.update({ imgClass: 'second-class' })
      const trigger = viewer.getTrigger()!

      expect(trigger.classList.contains('first-class')).toBe(false)
      expect(trigger.classList.contains('second-class')).toBe(true)
      expect(trigger.classList.contains('hana-img-viewer-thumbnail')).toBe(true)
      viewer.unmount()
    })
  })
}
