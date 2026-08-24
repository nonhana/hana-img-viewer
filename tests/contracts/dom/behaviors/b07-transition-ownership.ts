import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'
import { getAnimationCalls, getPendingAnimationCount, resolvePendingAnimation, setAnimationSequence, setSelectorRect, triggerResizeObservers } from '../../../environment/dom.setup'

export const registerB7TransitionOwnership = (adapter: DomAdapter) => {
  describe('[behavior/B7] FLIP transition ownership', () => {
    it('animates between distinct origin and destination geometry', async () => {
      setSelectorRect('.hana-img-viewer-thumbnail-root', { x: 10, y: 20, width: 100, height: 80 })
      setSelectorRect('.hana-img-viewer-flip-shell', { x: 100, y: 120, width: 800, height: 600 })
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()

      const shellAnimation = getAnimationCalls().find(call => call.element.classList.contains('hana-img-viewer-flip-shell'))
      expect(shellAnimation).toBeDefined()
      expect(shellAnimation?.keyframes[0]?.transform).toContain('scale(')
      expect(shellAnimation?.keyframes[1]?.transform).toContain('scale(1)')
      viewer.unmount()
    })

    it('cancels obsolete animation owners and pending work on unmount', async () => {
      setAnimationSequence(['pending', 'pending', 'pending', 'pending'])
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      expect(getPendingAnimationCount()).toBeGreaterThan(0)
      viewer.unmount()
      expect(getPendingAnimationCount()).toBe(0)
      expect(viewer.getDialog()).toBeNull()
    })

    it('remeasures from the current visual shell without resetting the session', async () => {
      const viewer = await adapter.mount({ src: 'thumb.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const shell = viewer.getFlipShell()!
      shell.style.transform = 'matrix(1, 0, 0, 1, 10, 20)'
      triggerResizeObservers()
      await viewer.settle()
      expect(viewer.getDialog()).not.toBeNull()
      expect(getAnimationCalls().some(call => call.element === shell)).toBe(true)
      viewer.unmount()
    })

    it('preserves zoom and pan when a closing session reverses into opening', async () => {
      const viewer = await adapter.mount({
        src: 'thumb.jpg',
        visibility: { kind: 'external', open: true },
      })
      await viewer.settle()
      const preview = viewer.getPreview()!
      preview.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))
      await viewer.settle()
      expect(preview.style.transform).toContain('scale(2)')

      setAnimationSequence(['pending', 'pending', 'pending', 'pending', 'pending', 'pending'])
      await viewer.update({ visibility: { kind: 'external', open: false } })
      await viewer.update({ visibility: { kind: 'external', open: true } })
      while (getPendingAnimationCount() > 0)
        resolvePendingAnimation()
      await viewer.settle()
      expect(viewer.getPreview()?.style.transform).toContain('scale(2)')
      viewer.unmount()
    })
  })
}
