import { preventDefault } from '../utils'

interface EventHandlers {
  handleWheel: (event: WheelEvent) => void
  handleTouchStart: (event: TouchEvent) => void
  handleKeyDown: (event: KeyboardEvent) => void
}

export function useEventListeners(handlers: EventHandlers) {
  const { handleWheel, handleTouchStart, handleKeyDown } = handlers

  function toggleEventListener(type: 'on' | 'off') {
    if (typeof window === 'undefined')
      return

    switch (type) {
      case 'on':
        window.addEventListener('wheel', preventDefault, { passive: false })
        window.addEventListener('touchmove', preventDefault, { passive: false })

        window.addEventListener('wheel', handleWheel)
        window.addEventListener('touchstart', handleTouchStart)
        window.addEventListener('keydown', handleKeyDown)
        break

      case 'off':
        window.removeEventListener('wheel', preventDefault)
        window.removeEventListener('touchmove', preventDefault)

        window.removeEventListener('wheel', handleWheel)
        window.removeEventListener('touchstart', handleTouchStart)
        window.removeEventListener('keydown', handleKeyDown)
        break

      default:
        break
    }
  }

  return {
    toggleEventListener,
  }
}
