import { describe, expect, it } from 'vitest'
import { defineHydrationContract } from '../../contracts/hydration/define-hydration-contract'
import { hydrateVueInParagraph, vueHydrationAdapter } from './hydration.adapter'

defineHydrationContract(vueHydrationAdapter)

describe('[vue-integration] prose hydration', () => {
  it('uses a div for the viewer origin by default', async () => {
    const result = await vueHydrationAdapter.hydrate({ src: '/thumb.jpg', open: false })

    try {
      expect(result.host.querySelector('div.hana-img-viewer-thumbnail-root')).not.toBeNull()
      expect(result.warnings).toEqual([])
    }
    finally {
      result.unmount()
    }
  })

  it('preserves the viewer origin inside a paragraph without hydration warnings', async () => {
    const result = await hydrateVueInParagraph({ src: '/thumb.jpg', open: false })

    try {
      expect(result.serverHtml).toContain('/thumb.jpg')
      const origin = result.host.querySelector('p > .hana-img-viewer-thumbnail-root')
      expect(origin?.tagName).toBe('SPAN')
      expect(origin?.hasAttribute('as')).toBe(false)
      expect(result.warnings).toEqual([])
    }
    finally {
      result.unmount()
    }
  })
})
