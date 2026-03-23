import type { MaybeRefOrGetter, Ref } from 'vue'
import { readonly, ref, toValue, watch } from 'vue'
import { isClient, tryOnScopeDispose } from '@/utils/helpers'

/**
 * useElementBounding 选项
 */
export interface UseElementBoundingOptions {
  /**
   * 是否监听窗口 resize 事件
   * @default true
   */
  windowResize?: boolean
  /**
   * 是否监听窗口 scroll 事件
   * @default true
   */
  windowScroll?: boolean
  /**
   * 是否立即测量
   * @default true
   */
  immediate?: boolean
  /**
   * 位置变化回调
   */
  onChange?: (rect: DOMRect) => void
}

/**
 * useElementBounding 返回值
 */
export interface UseElementBoundingReturn {
  /** 元素宽度 */
  width: Readonly<Ref<number>>
  /** 元素高度 */
  height: Readonly<Ref<number>>
  /** 元素顶部距离视口顶部的距离 */
  top: Readonly<Ref<number>>
  /** 元素左侧距离视口左侧的距离 */
  left: Readonly<Ref<number>>
  /** 元素右侧距离视口左侧的距离 */
  right: Readonly<Ref<number>>
  /** 元素底部距离视口顶部的距离 */
  bottom: Readonly<Ref<number>>
  /** 元素 x 坐标（等同于 left） */
  x: Readonly<Ref<number>>
  /** 元素 y 坐标（等同于 top） */
  y: Readonly<Ref<number>>
  /** 手动触发测量 */
  update: () => void
  /** 停止监听 */
  stop: () => void
}

/**
 * 元素边界追踪 composable
 *
 * 特性：
 * - 使用 ResizeObserver 监听尺寸变化
 * - 监听滚动容器的 scroll 事件
 * - 使用 requestAnimationFrame 节流更新
 * - 响应式返回元素位置信息
 * - 自动在 scope 销毁时清理
 *
 * @param target - 目标元素
 * @param options - 配置选项
 * @returns 元素边界信息和控制方法
 *
 * @example
 * ```ts
 * const el = ref<HTMLElement | null>(null)
 * const { width, height, top, left, update, stop } = useElementBounding(el)
 *
 * // 响应式获取位置
 * watchEffect(() => {
 *   console.log(`位置: (${left.value}, ${top.value}), 尺寸: ${width.value}x${height.value}`)
 * })
 *
 * // 手动更新
 * update()
 *
 * // 停止监听
 * stop()
 * ```
 */
export function useElementBounding(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseElementBoundingOptions = {},
): UseElementBoundingReturn {
  const {
    windowResize = true,
    windowScroll = true,
    immediate = true,
    onChange,
  } = options

  // 响应式边界值
  const width = ref(0)
  const height = ref(0)
  const top = ref(0)
  const left = ref(0)
  const right = ref(0)
  const bottom = ref(0)
  const x = ref(0)
  const y = ref(0)

  // 内部状态
  let resizeObserver: ResizeObserver | null = null
  let rafId: number | null = null
  const cleanupFns: (() => void)[] = []

  /**
   * 测量元素边界
   */
  const measure = (): void => {
    const el = toValue(target)
    if (!el) {
      width.value = 0
      height.value = 0
      top.value = 0
      left.value = 0
      right.value = 0
      bottom.value = 0
      x.value = 0
      y.value = 0
      return
    }

    const rect = el.getBoundingClientRect()

    width.value = rect.width
    height.value = rect.height
    top.value = rect.top
    left.value = rect.left
    right.value = rect.right
    bottom.value = rect.bottom
    x.value = rect.x
    y.value = rect.y

    onChange?.(rect)
  }

  /**
   * 使用 RAF 调度测量（节流）
   */
  const scheduleMeasure = (): void => {
    if (rafId !== null)
      return

    rafId = requestAnimationFrame(() => {
      measure()
      rafId = null
    })
  }

  /**
   * 检查元素是否可滚动
   */
  const isScrollable = (el: Element): boolean => {
    const style = getComputedStyle(el)
    const check = (v: string) => v === 'auto' || v === 'scroll' || v === 'overlay'
    return check(style.overflowX) || check(style.overflowY) || check(style.overflow)
  }

  /**
   * 获取所有滚动父元素
   */
  const getScrollParents = (el: Element): (Element | Window)[] => {
    const parents: (Element | Window)[] = []
    let current: Element | null = el.parentElement

    while (current) {
      if (isScrollable(current)) {
        parents.push(current)
      }
      current = current.parentElement
    }

    // 始终包含 window
    parents.push(window)
    return parents
  }

  /**
   * 清理所有监听器
   */
  const cleanup = (): void => {
    // 清理事件监听
    for (const fn of cleanupFns) {
      fn()
    }
    cleanupFns.length = 0

    // 清理 ResizeObserver
    resizeObserver?.disconnect()
    resizeObserver = null

    // 取消 RAF
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  /**
   * 设置监听器
   */
  const setup = (): void => {
    cleanup()

    if (!isClient)
      return

    const el = toValue(target)
    if (!el)
      return

    // 监听元素尺寸变化
    resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(el)

    // 监听滚动父元素
    const scrollParents = getScrollParents(el)
    for (const parent of scrollParents) {
      parent.addEventListener('scroll', scheduleMeasure, { passive: true })
      cleanupFns.push(() => parent.removeEventListener('scroll', scheduleMeasure))
    }

    // 监听窗口 resize
    if (windowResize) {
      window.addEventListener('resize', scheduleMeasure, { passive: true })
      cleanupFns.push(() => window.removeEventListener('resize', scheduleMeasure))

      // 监听 visualViewport（移动端）
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleMeasure, { passive: true })
        window.visualViewport.addEventListener('scroll', scheduleMeasure, { passive: true })
        cleanupFns.push(() => {
          window.visualViewport?.removeEventListener('resize', scheduleMeasure)
          window.visualViewport?.removeEventListener('scroll', scheduleMeasure)
        })
      }
    }

    // 监听窗口 scroll
    if (windowScroll) {
      window.addEventListener('scroll', scheduleMeasure, { passive: true })
      cleanupFns.push(() => window.removeEventListener('scroll', scheduleMeasure))
    }

    // 如果是图片，监听 load 事件
    if (el.tagName === 'IMG') {
      const img = el as HTMLImageElement
      if (!img.complete) {
        const handleLoad = () => measure()
        img.addEventListener('load', handleLoad)
        cleanupFns.push(() => img.removeEventListener('load', handleLoad))
      }
    }

    // 立即测量
    if (immediate) {
      measure()
    }
  }

  // 监听目标元素变化
  const stopWatch = watch(
    () => toValue(target),
    () => setup(),
    { immediate: true },
  )

  /**
   * 手动更新
   */
  const update = (): void => {
    measure()
  }

  /**
   * 停止所有监听
   */
  const stop = (): void => {
    stopWatch()
    cleanup()
  }

  // 自动在 scope 销毁时清理
  tryOnScopeDispose(stop)

  return {
    width: readonly(width),
    height: readonly(height),
    top: readonly(top),
    left: readonly(left),
    right: readonly(right),
    bottom: readonly(bottom),
    x: readonly(x),
    y: readonly(y),
    update,
    stop,
  }
}
