import type { DomAdapter } from '../adapter'
import { describe, expect, it } from 'vitest'
import { getImageRequestCount, resolvePendingImage, setImageSequence } from '../../../environment/dom.setup'

export const registerB9SourceEnhancement = (adapter: DomAdapter) => {
  describe('[behavior/B9] silent source enhancement', () => {
    it('keeps the base on failure and retries the enhancement in a later session', async () => {
      setImageSequence('preview.jpg', ['error', 'load'])
      const viewer = await adapter.mount({ src: 'thumb.jpg', previewSrc: 'preview.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      expect(viewer.getPreview()?.src).toContain('thumb.jpg')
      expect(getImageRequestCount('preview.jpg')).toBe(1)

      viewer.getBackdrop()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      expect(getImageRequestCount('preview.jpg')).toBe(2)
      expect(viewer.getPreview()?.src).toContain('preview.jpg')
      viewer.unmount()
    })

    it('applies a successful preview without exposing a loading state', async () => {
      setImageSequence('preview.jpg', ['pending'])
      const viewer = await adapter.mount({ src: 'thumb.jpg', previewSrc: 'preview.jpg' })
      viewer.getTrigger()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await viewer.settle()
      expect(viewer.getPreview()?.src).toContain('thumb.jpg')
      resolvePendingImage('preview.jpg')
      await viewer.settle()
      expect(viewer.getPreview()?.src).toContain('preview.jpg')
      viewer.unmount()
    })
  })
}
