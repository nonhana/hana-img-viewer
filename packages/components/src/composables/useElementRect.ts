import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { addPassive } from '../utils'

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

  let cleanupFns: (() => void)[] = []
  let targetObserver: ResizeObserver | null = null
  let htmlResizeObserver: ResizeObserver | null = null
  let rafId = 0

  const measure = () => {
    if (!target.value)
      return
    const newRect = target.value.getBoundingClientRect()
    rect.value = newRect
    options.onChange?.(newRect)
  }

  const scheduleMeasure = () => {
    if (rafId)
      cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(measure)
  }

  const isScrollable = (el: Element) => {
    const style = getComputedStyle(el)
    const overflowX = style.overflowX
    const overflowY = style.overflowY
    const overflow = style.overflow
    const scrollable = (v: string) => v === 'auto' || v === 'scroll' || v === 'overlay'
    return scrollable(overflowX) || scrollable(overflowY) || scrollable(overflow)
  }

  const getScrollParents = (el: Element | null) => {
    const parents: Array<Element | Window> = []
    if (!el)
      return parents
    let current: Element | null = el.parentElement
    while (current) {
      if (isScrollable(current))
        parents.push(current)
      current = current.parentElement
    }
    parents.push(window)
    return parents
  }

  const teardownObservers = () => {
    for (const off of cleanupFns) off()
    cleanupFns = []
    targetObserver?.disconnect()
    targetObserver = null
    htmlResizeObserver?.disconnect()
    htmlResizeObserver = null
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  const setupObservers = () => {
    teardownObservers()
    if (!target.value)
      return

    const parents = getScrollParents(target.value)
    for (const p of parents) {
      cleanupFns.push(addPassive(p, 'scroll', scheduleMeasure))
    }
    cleanupFns.push(addPassive(window, 'resize', scheduleMeasure))
    if (window.visualViewport) {
      const vv = window.visualViewport
      cleanupFns.push(addPassive(vv, 'resize', scheduleMeasure))
      cleanupFns.push(addPassive(vv, 'scroll', scheduleMeasure))
    }

    targetObserver = new ResizeObserver(scheduleMeasure)
    targetObserver.observe(target.value)
    htmlResizeObserver = new ResizeObserver(scheduleMeasure)
    // 相较于 window 的 resize 事件，ResizeObserver 更符合现代最佳实践
    htmlResizeObserver.observe(document.documentElement)

    if (target.value.tagName === 'IMG') {
      const img = target.value as HTMLImageElement
      if (!img.complete) {
        cleanupFns.push(addPassive(img, 'load', measure))
      }
    }

    measure()
  }

  onMounted(setupObservers)

  onBeforeUnmount(teardownObservers)

  watch(target, setupObservers)

  return {
    rect,
  }
}
