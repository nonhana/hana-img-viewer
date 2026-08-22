import type { ViewerInteractionPhase } from '@/types'

import { useRef, useState } from 'react'

export interface UseViewerPhaseOptions {
  /** Controlled `open` value. */
  open: boolean | undefined
  /** Whether the component is in controlled mode (decided once at mount time). */
  isControlled: boolean
  /** Initial phase, mirrors Vue's mount-time immediate controlled sync. */
  initialPhase: ViewerInteractionPhase
  /** Callback to report open-state intent to the parent. */
  onOpenChange: (value: boolean) => void
}

export interface UseViewerPhaseReturn {
  phase: ViewerInteractionPhase
  isOpen: boolean
  requestOpen: () => void
  requestClose: () => void
  markOpened: () => void
  markClosed: () => void
}

/**
 * Owns the canonical four-state phase machine for the viewer.
 *
 * `phase` is the single source of truth for visual state. `isOpen` is derived.
 *
 * Contract:
 * - In **uncontrolled** mode, `requestOpen`/`requestClose` transition phase
 *   directly and also report intent via `onOpenChange`.
 * - In **controlled** mode, `requestOpen`/`requestClose` ONLY report intent;
 *   the parent must set `props.open` for phase to actually transition. This
 *   preserves the contract that "the parent owns visibility in controlled
 *   mode" — the test `keeps the viewer visually open in controlled mode until
 *   the parent updates open=false` depends on this behavior.
 * - The host component completes transitions by calling `markOpened` /
 *   `markClosed` after the FLIP animation resolves.
 */
export const useViewerPhase = (options: UseViewerPhaseOptions): UseViewerPhaseReturn => {
  const { open, isControlled, initialPhase, onOpenChange } = options

  const [phase, setPhase] = useState(initialPhase)
  const openRef = useRef(open)
  openRef.current = open
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const emitIfDiffers = (next: boolean): void => {
    if (isControlled && Boolean(openRef.current) === next)
      return
    onOpenChangeRef.current(next)
  }

  /** User-initiated open intent. */
  const requestOpen = (): void => {
    emitIfDiffers(true)
    if (isControlled)
      return
    setPhase(p => (p === 'closed' ? 'opening' : p))
  }

  /** User-initiated close intent. */
  const requestClose = (): void => {
    emitIfDiffers(false)
    if (isControlled)
      return
    setPhase(p => (p === 'opening' || p === 'open' ? 'closing' : p))
  }

  /** Animation completed: opening → open. */
  const markOpened = (): void => {
    setPhase(p => (p === 'opening' ? 'open' : p))
  }

  /** Animation completed: closing → closed. */
  const markClosed = (): void => {
    setPhase(p => (p === 'closing' ? 'closed' : p))
  }

  // Controlled prop → phase, applied while rendering: the React-sanctioned
  // "adjusting state during render" pattern replaces set-state-in-effect.
  // The mount-time render is a no-op because `initialPhase` already mirrors
  // `open` (and `prevOpen` starts at `open`), keeping the previous
  // mount-time-no-op effect contract.
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (isControlled) {
      if (open) {
        setPhase(p => (p === 'closed' ? 'opening' : p))
      }
      else {
        setPhase(p => (p === 'opening' || p === 'open' ? 'closing' : p))
      }
    }
  }

  return {
    phase,
    isOpen: phase !== 'closed',
    requestOpen,
    requestClose,
    markOpened,
    markClosed,
  }
}
