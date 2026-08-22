import { renderToString } from 'react-dom/server'

import { HanaImgViewer } from '@/index'

import { describe, expect, it } from '../support/vitest'

describe('HanaImgViewer SSR harness', () => {
  it('renders thumbnail-only markup for the default closed state', () => {
    const html = renderToString(
      <HanaImgViewer src="/thumb.jpg" alt="ssr thumbnail" />,
    )

    expect(html).toContain('/thumb.jpg')
    expect(html).toContain('ssr thumbnail')
    expect(html).not.toContain('draggable="false"')
  })

  it('supports SSR with open=true without touching client globals or emitting overlay markup on the server', () => {
    const html = renderToString(
      <HanaImgViewer src="/thumb.jpg" alt="ssr thumbnail" open={true} />,
    )

    expect(html).toContain('/thumb.jpg')
    expect(html).toContain('ssr thumbnail')
    expect(html).not.toContain('draggable="false"')
  })
})
