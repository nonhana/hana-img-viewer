import { act, renderHook } from '@testing-library/react'

import { useBodyLock } from '@/hooks/viewer/useBodyLock'

import { afterEach, beforeEach, describe, expect, it } from '../support/vitest'

// useBodyLock keeps a module-level refcount + snapshot. To prevent cross-test
// pollution (especially when a prior test crashed mid-flow), we proactively
// clear any inline body styles before each test and clear them again after.
beforeEach(() => {
  document.body.removeAttribute('style')
})

afterEach(() => {
  document.body.removeAttribute('style')
})

describe('useBodyLock', () => {
  it('locks body overflow on first instance', () => {
    const { result } = renderHook(() => useBodyLock())
    expect(document.body.style.overflow).toBe('')
    act(() => result.current.lock())
    expect(document.body.style.overflow).toBe('hidden')
    act(() => result.current.unlock())
    expect(document.body.style.overflow).toBe('')
  })

  it('refcounts across multiple instances (lock/unlock pairs)', () => {
    const instanceA = renderHook(() => useBodyLock())
    act(() => instanceA.result.current.lock())
    expect(document.body.style.overflow).toBe('hidden')

    const instanceB = renderHook(() => useBodyLock())
    act(() => instanceB.result.current.lock())
    expect(document.body.style.overflow).toBe('hidden')
    act(() => instanceB.result.current.unlock())
    expect(document.body.style.overflow).toBe('hidden') // A still holds

    instanceA.unmount() // auto-unlock on unmount
    expect(document.body.style.overflow).toBe('')
    instanceB.unmount()
  })

  it('auto-unlocks on unmount', () => {
    const { result, unmount } = renderHook(() => useBodyLock())
    act(() => result.current.lock())
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
