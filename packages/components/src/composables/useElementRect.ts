import type { Ref } from 'vue'
import { throttle } from 'throttle-debounce'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface UseElementRectOptions {
  throttle?: boolean
  throttleDelay?: number
  onChange?: (rect: DOMRectReadOnly) => void
}

export function useElementRect(
  target: Ref<HTMLElement | null>,
  options: UseElementRectOptions = {},
) {
  const rect = ref<DOMRectReadOnly | null>(null)
  let observer: ResizeObserver | null = null

  const updateRect = () => {
    if (!target.value)
      return

    const newRect = target.value.getBoundingClientRect()
    rect.value = newRect
    options.onChange?.(newRect)
  }

  const executeUpdate = options.throttle
    ? throttle(options.throttleDelay ?? 100, updateRect, { noTrailing: false })
    : updateRect

  const cleanup = () => {
    observer?.disconnect()
    observer = null
  }

  onMounted(() => {
    if (!target.value)
      return

    updateRect()

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(executeUpdate)
      observer.observe(target.value)
    }

    if (target.value.tagName === 'IMG') {
      const img = target.value as HTMLImageElement
      if (!img.complete) {
        img.addEventListener('load', updateRect, { once: true })
      }
    }
  })

  onUnmounted(cleanup)

  watch(target, (el, _, onCleanup) => {
    cleanup()

    if (!el)
      return

    updateRect()

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(executeUpdate)
      observer.observe(el)
    }

    if (el.tagName === 'IMG') {
      const img = el as HTMLImageElement
      if (!img.complete) {
        img.addEventListener('load', updateRect, { once: true })
      }
    }

    onCleanup(cleanup)
  })

  return {
    rect,
  }
}
