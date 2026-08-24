import { describe, expect, it } from 'vitest'
import {
  initialViewerState,
  viewerReducer,
} from './viewerReducer'

describe('viewerReducer', () => {
  it('moves through the complete opening and closing lifecycle', () => {
    const opening = viewerReducer(initialViewerState, { type: 'SHOW' })
    const open = viewerReducer(opening, { type: 'OPEN_FINISHED' })
    const closing = viewerReducer(open, { type: 'HIDE' })
    const closed = viewerReducer(closing, { type: 'CLOSE_FINISHED' })

    expect(opening).toEqual({ phase: 'opening' })
    expect(open).toEqual({ phase: 'open' })
    expect(closing).toEqual({ phase: 'closing' })
    expect(closed).toEqual({ phase: 'closed' })
  })

  it('reverses opening and closing immediately', () => {
    expect(viewerReducer({ phase: 'opening' }, { type: 'HIDE' })).toEqual({
      phase: 'closing',
    })
    expect(viewerReducer({ phase: 'closing' }, { type: 'SHOW' })).toEqual({
      phase: 'opening',
    })
  })

  it('ignores stale completion events and idempotent requests', () => {
    const open = { phase: 'open' } as const
    const closed = { phase: 'closed' } as const

    expect(viewerReducer(open, { type: 'OPEN_FINISHED' })).toBe(open)
    expect(viewerReducer(open, { type: 'SHOW' })).toBe(open)
    expect(viewerReducer(closed, { type: 'CLOSE_FINISHED' })).toBe(closed)
    expect(viewerReducer(closed, { type: 'HIDE' })).toBe(closed)
  })
})
