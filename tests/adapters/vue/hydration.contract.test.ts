import { describe, expect, it } from 'vitest'
import { defineHydrationContract } from '../../contracts/hydration/define-hydration-contract'
import { hydrateVueInParagraph, vueHydrationAdapter } from './hydration.adapter'

defineHydrationContract(vueHydrationAdapter)

describe('[vue-integration] prose hydration', () => {
  it('renders a native img as the viewer origin', async () => {
    const result = await vueHydrationAdapter.hydrate({ src: '/thumb.jpg', open: false })

    try {
      const origin = result.host.querySelector('img.hana-img-viewer-thumbnail')
      expect(origin?.tagName).toBe('IMG')
      expect(result.warnings).toEqual([])
    }
    finally {
      result.unmount()
    }
  })

  it('preserves the native img inside a paragraph without hydration warnings', async () => {
    const result = await hydrateVueInParagraph({ src: '/thumb.jpg', open: false })

    try {
      expect(result.serverHtml).toContain('/thumb.jpg')
      const origin = result.host.querySelector('p > img.hana-img-viewer-thumbnail')
      expect(origin?.tagName).toBe('IMG')
      expect(result.warnings).toEqual([])
    }
    finally {
      result.unmount()
    }
  })
})
