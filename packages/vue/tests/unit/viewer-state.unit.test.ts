import { initialViewerPhase, transitionViewerPhase } from '@/internal/viewerState'
import { describe, expect, it } from '../support/vitest'

describe('viewer state transitions', () => {
  it('supports opening and closing reversal', () => {
    expect(transitionViewerPhase(initialViewerPhase, { type: 'SHOW' })).toBe('opening')
    expect(transitionViewerPhase('opening', { type: 'HIDE' })).toBe('closing')
    expect(transitionViewerPhase('closing', { type: 'SHOW' })).toBe('opening')
  })

  it('ignores stale completion events', () => {
    expect(transitionViewerPhase('open', { type: 'OPEN_FINISHED' })).toBe('open')
    expect(transitionViewerPhase('opening', { type: 'CLOSE_FINISHED' })).toBe('opening')
    expect(transitionViewerPhase('closing', { type: 'OPEN_FINISHED' })).toBe('closing')
  })
})
