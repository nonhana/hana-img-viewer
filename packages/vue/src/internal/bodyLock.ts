import { getScrollbarWidth } from 'hana-img-viewer-core'

interface BodyLockSnapshot {
  overflow: string
  paddingRight: string
}

const owners = new Set<object>()
let snapshot: BodyLockSnapshot | null = null
let appliedOverflow: string | null = null
let appliedPaddingRight: string | null = null

export const acquireBodyLock = (owner: object) => {
  if (owners.has(owner))
    return

  if (owners.size === 0) {
    snapshot = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }

    const scrollbarWidth = getScrollbarWidth()
    const currentPadding = Number.parseInt(
      getComputedStyle(document.body).paddingRight,
      10,
    ) || 0

    appliedOverflow = 'hidden'
    appliedPaddingRight = scrollbarWidth > 0
      ? `${currentPadding + scrollbarWidth}px`
      : snapshot.paddingRight

    document.body.style.overflow = appliedOverflow
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = appliedPaddingRight
  }

  owners.add(owner)
}

export const releaseBodyLock = (owner: object) => {
  if (!owners.delete(owner) || owners.size > 0)
    return

  if (snapshot && document.body.style.overflow === appliedOverflow)
    document.body.style.overflow = snapshot.overflow

  if (
    snapshot
    && appliedPaddingRight !== null
    && document.body.style.paddingRight === appliedPaddingRight
  ) {
    document.body.style.paddingRight = snapshot.paddingRight
  }

  snapshot = null
  appliedOverflow = null
  appliedPaddingRight = null
}
