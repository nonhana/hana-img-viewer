import type { Ref } from 'vue'
import { throttle } from 'throttle-debounce'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface UseElementRectOptions {
  /** 是否开启节流，默认 false */
  throttle?: boolean
  /** 节流间隔，仅在 throttle = true 时有效，单位：ms */
  throttleDelay?: number
  /** 尺寸变更时触发的回调 */
  onChange?: (rect: DOMRectReadOnly) => void
}

/**
 * useElementRect：监听一个元素尺寸变化的响应式 Hook
 */
export function useElementRect(
  target: Ref<HTMLElement | null>,
  options: UseElementRectOptions = {},
) {
  const rect = ref<DOMRectReadOnly | null>(null)
  let observer: ResizeObserver | null = null

  const updateRect = () => {
    if (target.value) {
      const newRect = target.value.getBoundingClientRect()
      rect.value = newRect
      options.onChange?.(newRect)
    }
  }

  const executeUpdate = options.throttle
    ? throttle(options.throttleDelay ?? 100, updateRect)
    : updateRect

  onMounted(() => {
    if (!target.value)
      return

    updateRect() // 首次同步一次

    observer = new ResizeObserver(() => {
      executeUpdate()
    })

    observer.observe(target.value)

    // 针对图片等资源加载后的尺寸变化
    if (target.value.tagName === 'IMG') {
      const img = target.value as HTMLImageElement
      if (!img.complete) {
        img.addEventListener('load', updateRect, { once: true })
      }
    }
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  // 当 ref 替换 DOM 节点时，重新监听
  watch(target, (el, _prev, onCleanup) => {
    if (!el)
      return
    updateRect()

    observer?.disconnect()
    observer = new ResizeObserver(() => {
      executeUpdate()
    })
    observer.observe(el)

    // 针对图片加载监听
    if (el.tagName === 'IMG') {
      const img = el as HTMLImageElement
      if (!img.complete) {
        img.addEventListener('load', updateRect, { once: true })
      }
    }

    onCleanup(() => {
      observer?.disconnect()
    })
  })

  return {
    rect,
  }
}
