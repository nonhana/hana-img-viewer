import type { HydrationAdapter } from './adapter'
import { describe, expect, it } from 'vitest'

export const registerB13Hydration = (adapter: HydrationAdapter) => {
  describe('[behavior/B13] hydration', () => {
    it('keeps the first hydration snapshot origin-only and mounts one client overlay after commit', async () => {
      const result = await adapter.hydrate({ src: '/thumb.jpg', open: true })
      expect(result.serverHtml).toContain('/thumb.jpg')
      expect(result.serverHtml).not.toContain('hana-img-viewer-overlay')
      expect(result.firstSnapshot).toBeNull()

      await result.settle()
      expect(result.getClientOverlay()).not.toBeNull()
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1)
      expect(result.warnings).toEqual([])

      result.unmount()
      expect(document.querySelector('.hana-img-viewer-overlay')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    })
  })
}
