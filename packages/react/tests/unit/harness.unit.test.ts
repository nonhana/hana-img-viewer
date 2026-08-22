import { act, renderHook } from '@testing-library/react'

import { clamp, getMidpoint, getZoomAnchoredPosition } from 'hana-img-viewer-core'
import { useViewerPhase } from '@/hooks/viewer/useViewerPhase'

import { describe, expect, it } from '../support/vitest'

describe('verification harness unit baseline', () => {
  it('keeps pure math helpers deterministic', () => {
    expect(clamp(12, 0, 10)).toBe(10)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(getMidpoint({ x: 0, y: 0 }, { x: 4, y: 6 })).toEqual({ x: 2, y: 3 })
    expect(
      getZoomAnchoredPosition({ x: 0, y: 0 }, { x: 200, y: 100 }, 1, 2, {
        x: 100,
        y: 100,
      }),
    ).toEqual({ x: -100, y: 0 })
  })

  it('uncontrolled: request* drives phase directly and reports open changes', () => {
    const changes: boolean[] = []
    const { result } = renderHook(() =>
      useViewerPhase({
        open: undefined,
        isControlled: false,
        initialPhase: 'closed',
        onOpenChange: value => changes.push(value),
      }),
    )

    expect(result.current.phase).toBe('closed')
    expect(result.current.isOpen).toBe(false)

    act(() => result.current.requestOpen())
    expect(result.current.phase).toBe('opening')
    expect(result.current.isOpen).toBe(true)

    act(() => result.current.markOpened())
    expect(result.current.phase).toBe('open')

    act(() => result.current.requestClose())
    expect(result.current.phase).toBe('closing')
    expect(result.current.isOpen).toBe(true) // still derived-true until closed

    act(() => result.current.markClosed())
    expect(result.current.phase).toBe('closed')
    expect(result.current.isOpen).toBe(false)

    expect(changes).toEqual([true, false])
  })

  it('controlled: request* only reports — parent owns phase via prop changes', () => {
    const changes: boolean[] = []
    const { result, rerender } = renderHook(
      ({ open }) =>
        useViewerPhase({
          open,
          isControlled: true,
          initialPhase: 'closed',
          onOpenChange: value => changes.push(value),
        }),
      { initialProps: { open: false } },
    )

    // Parent sets open=true → effect transitions phase to 'opening'
    rerender({ open: true })
    expect(result.current.phase).toBe('opening')

    // User clicks close → report intent, phase MUST stay 'opening' until parent acks
    act(() => result.current.requestClose())
    expect(changes).toEqual([false])
    expect(result.current.phase).toBe('opening')

    // Parent acks by setting open=false → effect transitions phase to 'closing'
    rerender({ open: false })
    expect(result.current.phase).toBe('closing')
  })

  it('controlled: requestOpen does not report when intent matches current prop', () => {
    const changes: boolean[] = []
    const { result } = renderHook(() =>
      useViewerPhase({
        open: true,
        isControlled: true,
        initialPhase: 'opening',
        onOpenChange: value => changes.push(value),
      }),
    )

    act(() => result.current.requestOpen())
    expect(changes).toEqual([])
  })
})
