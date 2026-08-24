import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'
import { getPendingAnimationCount, resolvePendingAnimation, setAnimationSequence } from '../../../environment/dom.setup'

export const registerB11ContainerLifecycle = (adapter: DomAdapter) => {
  describe('[behavior/B11] mount container lifecycle', () => {
    it('keeps origin visible while a null target is pending and resumes after a target appears', async () => {
      const host = document.createElement('section')
      document.body.append(host)
      const viewer = await adapter.mount({ src: 'thumb.jpg', container: { kind: 'pending' } })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      expect(viewer.getDialog()).toBeNull()
      expect(viewer.getOrigin()?.style.visibility).not.toBe('hidden')
      expect(document.body.style.overflow).toBe('')

      await viewer.update({ container: { kind: 'custom', element: host } })
      await viewer.settle()
      expect(host.querySelector('[role="dialog"]')).not.toBeNull()
      viewer.unmount()
    })

    it('moves from body to custom and then back to pending without leaving portal side effects', async () => {
      const host = document.createElement('section')
      document.body.append(host)
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('hidden')

      await viewer.update({ container: { kind: 'custom', element: host } })
      await viewer.settle()
      expect(host.querySelector('[role="dialog"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('')

      await viewer.update({ container: { kind: 'pending' } })
      await viewer.settle()
      expect(document.querySelector('[role="dialog"]')).toBeNull()
      expect(viewer.getOrigin()?.style.visibility).not.toBe('hidden')
      viewer.unmount()
    })

    it('retains the old portal until its closing transition completes', async () => {
      const host = document.createElement('section')
      document.body.append(host)
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()

      setAnimationSequence(['pending', 'pending', 'pending', 'pending'])
      await viewer.update({ container: { kind: 'custom', element: host } })
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
      expect(host.querySelector('[role="dialog"]')).toBeNull()
      expect(document.body.style.overflow).toBe('hidden')

      while (getPendingAnimationCount() > 0)
        resolvePendingAnimation()
      await viewer.settle()
      expect(host.querySelector('[role="dialog"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('')
      viewer.unmount()
    })
  })
}
