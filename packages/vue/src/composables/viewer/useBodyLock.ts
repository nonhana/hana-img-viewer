import { getScrollbarWidth } from 'hana-img-viewer-core'
import { ref } from 'vue'
import { isClient, tryOnScopeDispose } from '@/utils/helpers'

interface BodyLockSnapshot {
  overflow: string
  paddingRight: string
}

let lockCount = 0
let snapshot: BodyLockSnapshot | null = null

export const useBodyLock = () => {
  const isLocked = ref(false)

  const lock = (): void => {
    if (!isClient || isLocked.value)
      return

    if (lockCount === 0) {
      snapshot = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      }

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'

      if (scrollbarWidth > 0) {
        const currentPadding = Number.parseInt(getComputedStyle(document.body).paddingRight, 10) || 0
        document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
      }
    }

    lockCount += 1
    isLocked.value = true
  }

  const unlock = (): void => {
    if (!isClient || !isLocked.value)
      return

    lockCount = Math.max(0, lockCount - 1)

    if (lockCount === 0 && snapshot) {
      document.body.style.overflow = snapshot.overflow
      document.body.style.paddingRight = snapshot.paddingRight
      snapshot = null
    }

    isLocked.value = false
  }

  tryOnScopeDispose(unlock)

  return {
    isLocked,
    lock,
    unlock,
  }
}
