import { getScrollbarWidth } from 'hana-img-viewer-core'
import { useEffect, useRef, useState } from 'react'
import { isClient } from '@/utils/helpers'

interface BodyLockSnapshot {
  overflow: string
  paddingRight: string
}

let lockCount = 0
let snapshot: BodyLockSnapshot | null = null

export interface UseBodyLockReturn {
  isLocked: boolean
  lock: () => void
  unlock: () => void
}

export const useBodyLock = (): UseBodyLockReturn => {
  const [isLocked, setIsLocked] = useState(false)
  const isLockedRef = useRef(false)

  const lock = (): void => {
    if (!isClient || isLockedRef.current)
      return

    if (lockCount === 0) {
      snapshot = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      }

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'

      if (scrollbarWidth > 0) {
        const currentPadding
          = Number.parseInt(getComputedStyle(document.body).paddingRight, 10)
            || 0
        document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
      }
    }

    lockCount += 1
    isLockedRef.current = true
    setIsLocked(true)
  }

  const unlock = (): void => {
    if (!isClient || !isLockedRef.current)
      return

    lockCount = Math.max(0, lockCount - 1)

    if (lockCount === 0 && snapshot) {
      document.body.style.overflow = snapshot.overflow
      document.body.style.paddingRight = snapshot.paddingRight
      snapshot = null
    }

    isLockedRef.current = false
    setIsLocked(false)
  }

  // Auto-release the lock when the owner unmounts.
  useEffect(
    () => () => {
      unlock()
    },
    [],
  )

  return {
    isLocked,
    lock,
    unlock,
  }
}
