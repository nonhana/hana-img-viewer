import type { ServerAdapter, ServerVisibility } from './adapter'
import { describe, expect, it } from 'vitest'

export const registerB13ServerRender = (adapter: ServerAdapter) => {
  describe('[behavior/B13] server render', () => {
    it.each<ServerVisibility>(['closed', 'local-open', 'external-open'])('renders only the origin for %s', async (visibility) => {
      const html = await adapter.render({ src: '/thumb.jpg', visibility })
      expect(html).toContain('/thumb.jpg')
      expect(html).not.toContain('hana-img-viewer-overlay')
      expect(html).not.toContain('hana-img-viewer-preview')
    })
  })
}
