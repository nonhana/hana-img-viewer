import { effectScope, ref } from 'vue'
import { useViewerSource } from '@/composables/viewer/useViewerSource'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual<typeof import('@/utils/helpers')>('@/utils/helpers')
  return {
    ...actual,
    isClient: true,
  }
})

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
  get src(): string { return this._src }
  set src(value: string) {
    this._src = value
    createdImages.push(this)
  }

  decode(): Promise<void> { return Promise.resolve() }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: MockImage })
})

afterEach(() => {
  createdImages.length = 0
})

function withScope<T>(fn: () => T): T {
  const scope = effectScope()
  try { return scope.run(fn) as T }
  finally { scope.stop() }
}

describe('useViewerSource', () => {
  it('initial displaySrc equals src and phase is base', () => {
    withScope(() => {
      const src = ref('/a.jpg')
      const s = useViewerSource({ src: () => src.value, previewSrc: () => undefined })
      expect(s.displaySrc.value).toBe('/a.jpg')
      expect(s.sourcePhase.value).toBe('base')
    })
  })

  it('beginSession bumps sessionId and activates session', async () => {
    withScope(async () => {
      const s = useViewerSource({ src: () => '/a.jpg', previewSrc: () => '/b.jpg' })
      const first = s.beginSession()
      const second = s.beginSession()
      expect(second).toBe(first + 1)
    })
  })

  it('endSession invalidates an in-flight enhancement', async () => {
    await withScope(async () => {
      const s = useViewerSource({ src: () => '/a.jpg', previewSrc: () => '/b.jpg' })
      s.beginSession()
      const pending = s.startEnhancement()

      // simulate image load
      await Promise.resolve()
      const img = createdImages.at(-1)

      s.endSession()
      img.onload?.()

      const settled = await pending
      expect(settled).toBe(false)
      expect(s.displaySrc.value).toBe('/a.jpg')
      expect(s.sourcePhase.value).not.toBe('enhanced')
    })
  })

  it('reset returns displaySrc to current src and phase to base', () => {
    withScope(() => {
      const src = ref('/a.jpg')
      const s = useViewerSource({ src: () => src.value, previewSrc: () => '/b.jpg' })
      src.value = '/c.jpg'
      s.reset()
      expect(s.displaySrc.value).toBe('/c.jpg')
      expect(s.sourcePhase.value).toBe('base')
    })
  })

  it('startEnhancement returns false when previewSrc equals src', async () => {
    await withScope(async () => {
      const s = useViewerSource({ src: () => '/a.jpg', previewSrc: () => '/a.jpg' })
      s.beginSession()
      const ok = await s.startEnhancement()
      expect(ok).toBe(false)
    })
  })

  it('startEnhancement returns false when previewSrc is undefined', async () => {
    await withScope(async () => {
      const s = useViewerSource({ src: () => '/a.jpg', previewSrc: () => undefined })
      s.beginSession()
      const ok = await s.startEnhancement()
      expect(ok).toBe(false)
    })
  })
})
