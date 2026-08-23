import { renderToString } from 'react-dom/server'

import HanaImgViewer from '@/index'
import { describe, expect, it } from '../support/vitest'

describe('HanaImgViewer replacement SSR', () => {
  it.each([
    ['closed', <HanaImgViewer key="closed" src="thumb.jpg" />],
    ['controlled open', <HanaImgViewer key="controlled" src="thumb.jpg" open />],
    ['default open', <HanaImgViewer key="default" src="thumb.jpg" defaultOpen />],
  ])('[behavior/B13] renders only the thumbnail when %s', (_label, element) => {
    const html = renderToString(element)

    expect(html).toContain('thumb.jpg')
    expect(html).not.toContain('hana-img-viewer-overlay')
  })
})
