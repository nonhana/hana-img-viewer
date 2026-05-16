import { effectScope } from 'vue'
import { useBodyLock } from '@/composables/viewer/useBodyLock'
import { afterEach, beforeEach, describe, expect, it } from '../support/vitest'

// useBodyLock keeps a module-level refcount + snapshot. To prevent cross-test
// pollution (especially when a prior test crashed mid-flow), we proactively
// drain any leftover locks before each test and clear inline body styles after.
beforeEach(() => {
  // The composable doesn't expose its internal counter, but calling unlock()
  // repeatedly through a fresh scope is a no-op once the count hits zero, so we
  // can't drain it that way. Instead we directly clear the body style attributes
  // the lock touches — the next call to lock() will recapture a fresh snapshot.
  document.body.removeAttribute('style')
})

afterEach(() => {
  document.body.removeAttribute('style')
})

describe('useBodyLock', () => {
  it('locks body overflow on first instance', () => {
    const scope = effectScope()
    scope.run(() => {
      const { lock, unlock } = useBodyLock()
      expect(document.body.style.overflow).toBe('')
      lock()
      expect(document.body.style.overflow).toBe('hidden')
      unlock()
      expect(document.body.style.overflow).toBe('')
    })
    scope.stop()
  })

  it('refcounts across multiple instances (lock/unlock pairs)', () => {
    const scopeA = effectScope()
    const scopeB = effectScope()

    scopeA.run(() => {
      const { lock } = useBodyLock()
      lock()
    })
    expect(document.body.style.overflow).toBe('hidden')

    scopeB.run(() => {
      const { lock, unlock } = useBodyLock()
      lock()
      expect(document.body.style.overflow).toBe('hidden')
      unlock()
      expect(document.body.style.overflow).toBe('hidden') // A still holds
    })

    scopeA.stop() // tryOnScopeDispose should unlock A
    expect(document.body.style.overflow).toBe('')
    scopeB.stop()
  })

  it('auto-unlocks on scope dispose', () => {
    const scope = effectScope()
    scope.run(() => {
      const { lock } = useBodyLock()
      lock()
    })
    expect(document.body.style.overflow).toBe('hidden')
    scope.stop()
    expect(document.body.style.overflow).toBe('')
  })
})
