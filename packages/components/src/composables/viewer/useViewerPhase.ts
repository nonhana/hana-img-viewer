import type { ViewerInteractionPhase } from '@/types'
import { computed, shallowRef, watch } from 'vue'

export interface UseViewerPhaseOptions {
  /** Reactive getter for the controlled `open` prop. */
  open: () => boolean | undefined
  /** Whether the component is in controlled mode (decided once at mount time). */
  isControlled: () => boolean
  /** Callback to emit `update:open` to the parent. */
  onOpenChange: (value: boolean) => void
}

/**
 * Owns the canonical four-state phase machine for the viewer.
 *
 * `phase` is the single source of truth for visual state. `isOpen` is derived.
 *
 * Contract:
 * - In **uncontrolled** mode, `requestOpen`/`requestClose` transition phase
 *   directly and also emit `update:open` for parents that opt-in to v-model.
 * - In **controlled** mode, `requestOpen`/`requestClose` ONLY emit intent;
 *   the parent must set `props.open` for phase to actually transition. The
 *   internal watcher on `options.open()` performs that phase transition.
 *   This preserves the contract that "the parent owns visibility in
 *   controlled mode" — the test `keeps the viewer visually open in controlled
 *   mode until the parent updates open=false` depends on this behavior.
 * - The host component completes transitions by calling `markOpened` /
 *   `markClosed` after the FLIP animation resolves.
 */
export function useViewerPhase(options: UseViewerPhaseOptions) {
  const phase = shallowRef<ViewerInteractionPhase>('closed')
  const isOpen = computed(() => phase.value !== 'closed')

  function emitIfDiffers(next: boolean): void {
    if (options.isControlled() && Boolean(options.open()) === next)
      return
    options.onOpenChange(next)
  }

  /** User-initiated open intent. */
  function requestOpen(): void {
    emitIfDiffers(true)
    if (options.isControlled())
      return
    if (phase.value === 'closed')
      phase.value = 'opening'
  }

  /** User-initiated close intent. */
  function requestClose(): void {
    emitIfDiffers(false)
    if (options.isControlled())
      return
    if (phase.value === 'opening' || phase.value === 'open')
      phase.value = 'closing'
  }

  /** Animation completed: opening → open. */
  function markOpened(): void {
    if (phase.value === 'opening')
      phase.value = 'open'
  }

  /** Animation completed: closing → closed. */
  function markClosed(): void {
    if (phase.value === 'closing')
      phase.value = 'closed'
  }

  // Controlled prop → phase. Runs immediately to handle open=true on mount.
  watch(
    () => Boolean(options.open()),
    (next) => {
      if (!options.isControlled())
        return
      if (next && phase.value === 'closed')
        phase.value = 'opening'
      else if (!next && (phase.value === 'opening' || phase.value === 'open'))
        phase.value = 'closing'
    },
    { immediate: true },
  )

  return {
    phase,
    isOpen,
    requestOpen,
    requestClose,
    markOpened,
    markClosed,
  }
}
