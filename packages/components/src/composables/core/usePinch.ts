import type { Ref } from 'vue'
import type { MaybeRefOrGetter, Point } from '../../types/utils'
import { readonly, ref } from 'vue'
import { isClient, toValue, tryOnScopeDispose } from '../../utils/helpers'
import { getDistance, getMidpoint } from '../../utils/math'
import { useEventListener } from '../utils/useEventListener'

/**
 * 双指缩放状态
 */
export interface PinchState {
  /** 相对于起始的缩放比例 */
  scale: number
  /** 双指中心点 */
  center: Point
  /** 相对于上一帧的缩放比例 */
  deltaScale: number
  /** 双指间距 */
  distance: number
  /** 是否是第一帧 */
  isFirst: boolean
  /** 是否是最后一帧 */
  isLast: boolean
  /** 原始事件 */
  event: TouchEvent
}

/**
 * usePinch 选项
 */
export interface UsePinchOptions {
  /**
   * 监听目标（元素 / window / document）
   */
  target: MaybeRefOrGetter<EventTarget | null | undefined>
  /**
   * 是否启用双指缩放
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * 双指缩放开始回调
   */
  onPinchStart?: (state: PinchState) => void
  /**
   * 双指缩放中回调
   */
  onPinch?: (state: PinchState) => void
  /**
   * 双指缩放结束回调
   */
  onPinchEnd?: (state: PinchState) => void
  /**
   * 是否阻止默认行为（防止页面缩放）
   * @default true
   */
  preventDefault?: boolean
}

/**
 * usePinch 返回值
 */
export interface UsePinchReturn {
  /** 是否正在双指缩放 */
  isPinching: Readonly<Ref<boolean>>
  /** 当前缩放比例 */
  scale: Readonly<Ref<number>>
  /** 停止监听 */
  stop: () => void
}

/**
 * 双指缩放 composable
 *
 * 特性：
 * - 监听双指触摸事件
 * - 计算双指距离变化（缩放比例）
 * - 计算双指中心点（缩放锚点）
 * - 使用 RAF 调度更新
 * - 提供完整的缩放状态信息
 *
 * @param options - 配置选项
 * @returns 缩放状态和控制方法
 *
 * @example
 * ```ts
 * const el = ref<HTMLElement | null>(null)
 *
 * const { isPinching, scale, stop } = usePinch({
 *   target: el,
 *   onPinchStart: (state) => console.log('开始缩放'),
 *   onPinch: (state) => {
 *     // state.scale 是相对于开始时的缩放比例
 *     // state.center 是缩放中心点
 *     transform.zoomAt(initialScale * state.scale, state.center)
 *   },
 *   onPinchEnd: (state) => console.log('结束缩放'),
 * })
 * ```
 */
export function usePinch(options: UsePinchOptions): UsePinchReturn {
  const {
    target,
    enabled = true,
    onPinchStart,
    onPinch,
    onPinchEnd,
    preventDefault = true,
  } = options

  // 状态
  const isPinching = ref(false)
  const scale = ref(1)

  // 内部状态
  let startDistance = 0
  let lastDistance = 0
  let rafId: number | null = null

  // 清理函数集合
  const cleanupFns: (() => void)[] = []

  /**
   * 从 TouchList 获取两个触摸点
   */
  const getTwoTouches = (touches: TouchList): [Touch, Touch] | null => {
    if (touches.length < 2)
      return null
    return [touches[0], touches[1]]
  }

  /**
   * 计算两个触摸点的距离和中心点
   */
  const getTouchMetrics = (touch1: Touch, touch2: Touch): { distance: number, center: Point } => {
    const p1: Point = { x: touch1.clientX, y: touch1.clientY }
    const p2: Point = { x: touch2.clientX, y: touch2.clientY }

    return {
      distance: getDistance(p1, p2),
      center: getMidpoint(p1, p2),
    }
  }

  /**
   * 是否需要阻止默认行为
   *
   * 在某些移动端浏览器中，仅拦截元素级 touch 事件不足以阻止页面级双指缩放，
   * 因此这里统一收敛判断，供文档级兜底监听复用。
   */
  const shouldPreventDefault = (): boolean => {
    return preventDefault && toValue(enabled)
  }

  /**
   * 创建缩放状态对象
   */
  const createPinchState = (
    event: TouchEvent,
    currentDistance: number,
    center: Point,
    isFirst: boolean,
    isLast: boolean,
  ): PinchState => {
    const currentScale = startDistance > 0 ? currentDistance / startDistance : 1
    const deltaScale = lastDistance > 0 ? currentDistance / lastDistance : 1

    return {
      scale: currentScale,
      center,
      deltaScale,
      distance: currentDistance,
      isFirst,
      isLast,
      event,
    }
  }

  /**
   * 处理触摸开始
   */
  const handleTouchStart = (event: TouchEvent): void => {
    // 检查是否启用
    if (!toValue(enabled))
      return

    // 需要至少两个触摸点
    const touches = getTwoTouches(event.touches)
    if (!touches)
      return

    // 阻止默认行为（防止页面缩放）
    if (preventDefault)
      event.preventDefault()

    const [touch1, touch2] = touches
    const { distance, center } = getTouchMetrics(touch1, touch2)

    // 记录起始状态
    startDistance = distance
    lastDistance = distance
    scale.value = 1

    // 设置状态
    isPinching.value = true

    // 触发开始回调
    const state = createPinchState(event, distance, center, true, false)
    onPinchStart?.(state)
  }

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = (event: TouchEvent): void => {
    if (!isPinching.value)
      return

    // 取消待执行的 RAF
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    // 计算最终状态
    const center: Point = { x: 0, y: 0 }
    const state = createPinchState(event, lastDistance, center, false, true)

    // 触发结束回调
    onPinchEnd?.(state)

    // 重置状态
    isPinching.value = false
    startDistance = 0
    lastDistance = 0
  }

  /**
   * 处理触摸移动
   */
  const handleTouchMove = (event: TouchEvent): void => {
    if (!isPinching.value)
      return

    const touches = getTwoTouches(event.touches)
    if (!touches) {
      // 触摸点少于2个，结束缩放
      handleTouchEnd(event)
      return
    }

    // 阻止默认行为
    if (preventDefault)
      event.preventDefault()

    // 使用 RAF 调度更新
    if (rafId !== null)
      return

    rafId = requestAnimationFrame(() => {
      rafId = null

      const currentTouches = getTwoTouches(event.touches)
      if (!currentTouches)
        return

      const [touch1, touch2] = currentTouches
      const { distance, center } = getTouchMetrics(touch1, touch2)

      // 更新缩放比例
      scale.value = startDistance > 0 ? distance / startDistance : 1

      // 触发回调
      const state = createPinchState(event, distance, center, false, false)
      onPinch?.(state)

      // 更新上一帧距离
      lastDistance = distance
    })
  }

  /**
   * 设置事件监听
   */
  const setup = (): void => {
    if (!isClient)
      return

    // 使用 passive: false 以便能够调用 preventDefault
    const { stop: stopTouchStart } = useEventListener(
      target,
      'touchstart',
      evt => handleTouchStart(evt as TouchEvent),
      { passive: false },
    )
    cleanupFns.push(stopTouchStart)

    const { stop: stopTouchMove } = useEventListener(
      target,
      'touchmove',
      evt => handleTouchMove(evt as TouchEvent),
      { passive: false },
    )
    cleanupFns.push(stopTouchMove)

    const { stop: stopTouchEnd } = useEventListener(
      target,
      'touchend',
      evt => handleTouchEnd(evt as TouchEvent),
    )
    cleanupFns.push(stopTouchEnd)

    const { stop: stopTouchCancel } = useEventListener(
      target,
      'touchcancel',
      evt => handleTouchEnd(evt as TouchEvent),
    )
    cleanupFns.push(stopTouchCancel)

    /**
     * 文档级兜底：阻止浏览器视口缩放
     *
     * - iOS Safari 可能通过 gesture* 触发页面缩放
     * - 部分浏览器在触点落在目标外时不会稳定命中元素级 preventDefault
     */
    const preventViewportPinchByTouch = (event: Event): void => {
      if (!shouldPreventDefault())
        return

      const touchEvent = event as TouchEvent
      if (touchEvent.touches.length < 2)
        return

      touchEvent.preventDefault()
    }

    const preventViewportPinchByGesture = (event: Event): void => {
      if (!shouldPreventDefault())
        return
      event.preventDefault()
    }

    const documentTarget = () => document

    const { stop: stopDocumentTouchMove } = useEventListener(
      documentTarget,
      'touchmove',
      preventViewportPinchByTouch,
      { passive: false, capture: true },
    )
    cleanupFns.push(stopDocumentTouchMove)

    const { stop: stopGestureStart } = useEventListener(
      documentTarget,
      'gesturestart',
      preventViewportPinchByGesture,
      { passive: false, capture: true },
    )
    cleanupFns.push(stopGestureStart)

    const { stop: stopGestureChange } = useEventListener(
      documentTarget,
      'gesturechange',
      preventViewportPinchByGesture,
      { passive: false, capture: true },
    )
    cleanupFns.push(stopGestureChange)
  }

  /**
   * 清理
   */
  const cleanup = (): void => {
    for (const fn of cleanupFns) {
      fn()
    }
    cleanupFns.length = 0

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  /**
   * 停止监听
   */
  const stop = (): void => {
    cleanup()
    isPinching.value = false
  }

  // 初始化
  setup()

  // 自动清理
  tryOnScopeDispose(stop)

  return {
    isPinching: readonly(isPinching),
    scale: readonly(scale),
    stop,
  }
}
