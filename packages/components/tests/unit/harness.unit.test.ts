import { effectScope, nextTick, ref } from 'vue'
import { useViewerPhase } from '@/composables/viewer/useViewerPhase'
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

  it('uncontrolled: request* drives phase directly and emits update:open', () => {
    const changes: boolean[] = []
    const scope = effectScope()

    scope.run(() => {
      const { phase, isOpen, requestOpen, markOpened, requestClose, markClosed } = useViewerPhase({
        open: () => undefined,
        isControlled: () => false,
        onOpenChange: value => changes.push(value),
      })

      expect(phase.value).toBe('closed')
      expect(isOpen.value).toBe(false)

      requestOpen()
      expect(phase.value).toBe('opening')
      expect(isOpen.value).toBe(true)

      markOpened()
      expect(phase.value).toBe('open')

      requestClose()
      expect(phase.value).toBe('closing')
      expect(isOpen.value).toBe(true) // still derived-true until closed

      markClosed()
      expect(phase.value).toBe('closed')
      expect(isOpen.value).toBe(false)
    })

    scope.stop()

    expect(changes).toEqual([true, false])
  })

  it('controlled: request* only emits — parent owns phase via prop changes', async () => {
    const changes: boolean[] = []
    const prop = ref(false)
    const scope = effectScope()

    await scope.run(async () => {
      const { phase, requestClose } = useViewerPhase({
        open: () => prop.value,
        isControlled: () => true,
        onOpenChange: value => changes.push(value),
      })

      // Parent sets open=true → watch transitions phase to 'opening'
      prop.value = true
      await nextTick()
      expect(phase.value).toBe('opening')

      // User clicks close → emit intent, phase MUST stay 'opening' until parent acks
      requestClose()
      expect(changes).toEqual([false])
      expect(phase.value).toBe('opening')

      // Parent acks by setting open=false → watch transitions phase to 'closing'
      prop.value = false
      await nextTick()
      expect(phase.value).toBe('closing')
    })

    scope.stop()
  })

  it('controlled: requestOpen does not emit when intent matches current prop', () => {
    const changes: boolean[] = []
    const prop = ref(true)
    const scope = effectScope()

    scope.run(() => {
      const { requestOpen } = useViewerPhase({
        open: () => prop.value,
        isControlled: () => true,
        onOpenChange: value => changes.push(value),
      })

      // prop is already true; requestOpen should not emit a redundant update.
      requestOpen()
      expect(changes).toEqual([])
    })

    scope.stop()
  })
})
