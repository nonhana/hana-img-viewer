import { useCallback, useRef, useState } from 'react'

export interface ElementRefHandle<T extends HTMLElement> {
  ref: { current: T | null }
  el: T | null
  attach: (node: T | null) => void
}

/**
 * Tracks a rendered element both as a stable ref (for imperative reads inside
 * async flows) and as state (to drive effect re-attachment when the element
 * mounts/unmounts).
 */
export const useElementRef = <T extends HTMLElement>(): ElementRefHandle<T> => {
  const ref = useRef<T | null>(null)
  const [el, setEl] = useState<T | null>(null)

  const attach = useCallback((node: T | null) => {
    ref.current = node
    setEl(node)
  }, [])

  return { ref, el, attach }
}
