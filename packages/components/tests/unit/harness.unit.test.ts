import { effectScope, ref } from 'vue'
import { useViewerOpenState } from '@/composables/viewer/useViewerOpenState'
import { clamp, getMidpoint, getZoomAnchoredPosition } from '@/utils'
import { describe, expect, it } from '../support/vitest'

describe('verification harness unit baseline', () => {
  it('keeps pure math helpers deterministic', () => {
    expect(clamp(12, 0, 10)).toBe(10)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(getMidpoint({ x: 0, y: 0 }, { x: 4, y: 6 })).toEqual({ x: 2, y: 3 })
    expect(getZoomAnchoredPosition(
      { x: 0, y: 0 },
      { x: 200, y: 100 },
      1,
      2,
      { x: 100, y: 100 },
    )).toEqual({ x: -100, y: 0 })
  })

  it('uses internal state in uncontrolled mode', () => {
    const changes: boolean[] = []
    const scope = effectScope()

    scope.run(() => {
      const { isOpen } = useViewerOpenState({
        open: () => undefined,
        isControlled: () => false,
        onOpenChange: value => changes.push(value),
      })

      isOpen.value = true

      expect(isOpen.value).toBe(true)
    })

    scope.stop()

    expect(changes).toEqual([true])
  })

  it('treats controlled mode as emit-only', () => {
    const changes: boolean[] = []
    const prop = ref(false)
    const scope = effectScope()

    scope.run(() => {
      const { isOpen } = useViewerOpenState({
        open: () => prop.value,
        isControlled: () => true,
        onOpenChange: value => changes.push(value),
      })

      isOpen.value = true

      expect(isOpen.value).toBe(false)
      expect(prop.value).toBe(false)
    })

    scope.stop()

    expect(changes).toEqual([true])
  })
})
