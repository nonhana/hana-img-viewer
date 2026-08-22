import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { HanaImgViewer } from '@/index'
import { describe, expect, it } from '../support/vitest'

describe('HanaImgViewer SSR harness', () => {
  it('renders thumbnail-only markup for the default closed state', async () => {
    const app = createSSRApp({
      render: () => h(HanaImgViewer, {
        alt: 'ssr thumbnail',
        src: '/thumb.jpg',
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('/thumb.jpg')
    expect(html).toContain('ssr thumbnail')
    expect(html).not.toContain('draggable="false"')
  })

  it('supports SSR with open=true without touching client globals or emitting overlay markup on the server', async () => {
    const app = createSSRApp({
      render: () => h(HanaImgViewer, {
        alt: 'ssr thumbnail',
        open: true,
        src: '/thumb.jpg',
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('/thumb.jpg')
    expect(html).toContain('ssr thumbnail')
    expect(html).not.toContain('draggable="false"')
  })
})
