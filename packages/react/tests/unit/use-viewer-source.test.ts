import { act, renderHook } from '@testing-library/react'

import { useViewerSource } from '@/hooks/viewer/useViewerSource'

import { afterEach, beforeAll, describe, expect, it } from '../support/vitest'

interface MockImageState {
  src: string
  onload: (() => void) | null
  onerror: (() => void) | null
}

const createdImages: MockImageState[] = []

class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private _src = ''
  get src(): string {
    return this._src
  }

  set src(value: string) {
    this._src = value
    createdImages.push(this)
  }

  decode(): Promise<void> {
    return Promise.resolve()
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: MockImage,
  })
})

afterEach(() => {
  createdImages.length = 0
})

describe('useViewerSource', () => {
  it('initial displaySrc equals src and phase is base', () => {
    const { result } = renderHook(() =>
      useViewerSource({ src: () => '/a.jpg', previewSrc: () => undefined }),
    )
    expect(result.current.displaySrc).toBe('/a.jpg')
    expect(result.current.sourcePhase).toBe('base')
  })

  it('beginSession bumps sessionId and activates session', () => {
    const { result } = renderHook(() =>
      useViewerSource({ src: () => '/a.jpg', previewSrc: () => '/b.jpg' }),
    )
    let first = 0
    let second = 0
    act(() => {
      first = result.current.beginSession()
    })
    act(() => {
      second = result.current.beginSession()
    })
    expect(second).toBe(first + 1)
  })

  it('endSession invalidates an in-flight enhancement', async () => {
    const { result } = renderHook(() =>
      useViewerSource({ src: () => '/a.jpg', previewSrc: () => '/b.jpg' }),
    )

    let pending!: Promise<boolean>
    act(() => {
      result.current.beginSession()
      pending = result.current.startEnhancement()
    })

    // simulate image load
    await Promise.resolve()
    const img = createdImages.at(-1)

    act(() => {
      result.current.endSession()
    })
    act(() => {
      img?.onload?.()
    })

    const settled = await pending
    expect(settled).toBe(false)
    expect(result.current.displaySrc).toBe('/a.jpg')
    expect(result.current.sourcePhase).not.toBe('enhanced')
  })

  it('reset returns displaySrc to current src and phase to base', () => {
    const { result, rerender } = renderHook(
      ({ src }) =>
        useViewerSource({ src: () => src, previewSrc: () => '/b.jpg' }),
      { initialProps: { src: '/a.jpg' } },
    )
    rerender({ src: '/c.jpg' })
    act(() => {
      result.current.reset()
    })
    expect(result.current.displaySrc).toBe('/c.jpg')
    expect(result.current.sourcePhase).toBe('base')
  })

  it('startEnhancement returns false when previewSrc equals src', async () => {
    const { result } = renderHook(() =>
      useViewerSource({ src: () => '/a.jpg', previewSrc: () => '/a.jpg' }),
    )
    let ok = true
    await act(async () => {
      result.current.beginSession()
      ok = await result.current.startEnhancement()
    })
    expect(ok).toBe(false)
  })

  it('startEnhancement returns false when previewSrc is undefined', async () => {
    const { result } = renderHook(() =>
      useViewerSource({ src: () => '/a.jpg', previewSrc: () => undefined }),
    )
    let ok = true
    await act(async () => {
      result.current.beginSession()
      ok = await result.current.startEnhancement()
    })
    expect(ok).toBe(false)
  })
})
