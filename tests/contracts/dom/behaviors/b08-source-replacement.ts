import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'
import { getAnimationCalls, resolvePendingImage, setImageSequence } from '../../../environment/dom.setup'

export const registerB8SourceReplacement = (adapter: DomAdapter) => {
  describe('[behavior/B8] source replacement', () => {
    it('returns to the latest base source and ignores stale enhancement completion', async () => {
      setImageSequence('first-preview.jpg', ['pending'])
      setImageSequence('second-preview.jpg', ['pending'])
      const viewer = await adapter.mount({ src: 'first.jpg', previewSrc: 'first-preview.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      expect(viewer.getPreview()?.src).toContain('first.jpg')

      await viewer.update({ src: 'second.jpg', previewSrc: 'second-preview.jpg' })
      expect(viewer.getPreview()?.src).toContain('second.jpg')
      resolvePendingImage('first-preview.jpg')
      await viewer.settle()
      expect(viewer.getPreview()?.src).toContain('second.jpg')
      resolvePendingImage('second-preview.jpg')
      await viewer.settle()
      expect(viewer.getPreview()?.src).toContain('second-preview.jpg')
      viewer.unmount()
    })

    it('remeasures the shell after the replacement thumbnail loads', async () => {
      const viewer = await adapter.mount({ src: 'wide.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      const thumbnail = viewer.getTrigger() as HTMLImageElement
      Object.defineProperties(thumbnail, {
        naturalHeight: { configurable: true, value: 500 },
        naturalWidth: { configurable: true, value: 1000 },
      })
      thumbnail.dispatchEvent(new Event('load'))
      await viewer.settle()
      expect(getAnimationCalls().length).toBeGreaterThan(0)
      viewer.unmount()
    })
  })
}
