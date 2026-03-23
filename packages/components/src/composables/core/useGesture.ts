import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DragState } from './useDrag'
import type { PinchState } from './usePinch'
import type { WheelState } from './useWheel'
import type { Point } from '@/types/utils'
import { computed, readonly, toValue } from 'vue'
import { tryOnScopeDispose } from '@/utils/helpers'
import { useDrag } from './useDrag'
import { usePinch } from './usePinch'
import { useWheel } from './useWheel'

/**
 * 手势类型
 */
export type GestureType = 'drag' | 'pinch' | 'wheel' | 'none'

/**
 * useGesture 选项
 */
export interface UseGestureOptions {
  /**
   * 目标元素
   */
  target: MaybeRefOrGetter<HTMLElement | null | undefined>
  /**
   * 是否启用手势
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * 是否启用拖拽
   * @default true
   */
  enableDrag?: MaybeRefOrGetter<boolean>
  /**
   * 是否启用双指缩放
   * @default true
   */
  enablePinch?: MaybeRefOrGetter<boolean>
  /**
   * 是否启用滚轮缩放
   * @default true
   */
  enableWheel?: MaybeRefOrGetter<boolean>
  /**
   * 是否启用全局缩放监听（wheel / pinch）
   *
   * 开启后，当手势功能启用时会将缩放监听目标切换为 window，
   * 从而支持光标或双指中心在图片元素外时继续缩放。
   *
   * @default false
   */
  enableGlobalZoom?: MaybeRefOrGetter<boolean>
  /**
   * 滚轮缩放系数
   * @default 1
   */
  wheelZoomRatio?: MaybeRefOrGetter<number>
  /**
   * 拖拽回调
   */
  onDrag?: (state: DragState) => void
  /**
   * 拖拽开始回调
   */
  onDragStart?: (state: DragState) => void
  /**
   * 拖拽结束回调
   */
  onDragEnd?: (state: DragState) => void
  /**
   * 双指缩放回调
   */
  onPinch?: (state: PinchState) => void
  /**
   * 双指缩放开始回调
   */
  onPinchStart?: (state: PinchState) => void
  /**
   * 双指缩放结束回调
   */
  onPinchEnd?: (state: PinchState) => void
  /**
   * 滚轮回调
   */
  onWheel?: (state: WheelState) => void
  /**
   * 双击回调
   */
  onDoubleClick?: (position: Point, event: MouseEvent) => void
}

/**
 * useGesture 返回值
 */
export interface UseGestureReturn {
  /** 是否正在拖拽 */
  isDragging: Readonly<Ref<boolean>>
  /** 是否正在双指缩放 */
  isPinching: Readonly<Ref<boolean>>
  /** 是否正在滚轮滚动 */
  isWheeling: Readonly<Ref<boolean>>
  /** 是否有任何手势正在进行 */
  isInteracting: ComputedRef<boolean>
  /** 当前活动的手势类型 */
  activeGesture: ComputedRef<GestureType>
  /** 停止所有手势监听 */
  stop: () => void
}

/**
 * 双击检测器
 */
class DoubleClickDetector {
  private lastClickTime = 0
  private lastClickPosition: Point = { x: 0, y: 0 }
  private readonly threshold = 300 // 双击时间阈值 (ms)
  private readonly distance = 10 // 位置容差 (px)

  detect(position: Point): boolean {
    const now = Date.now()
    const timeDelta = now - this.lastClickTime
    const posDelta = Math.hypot(
      position.x - this.lastClickPosition.x,
      position.y - this.lastClickPosition.y,
    )

    const isDoubleClick = timeDelta < this.threshold && posDelta < this.distance

    this.lastClickTime = now
    this.lastClickPosition = position

    return isDoubleClick
  }

  reset(): void {
    this.lastClickTime = 0
    this.lastClickPosition = { x: 0, y: 0 }
  }
}

/**
 * 统一手势管理 composable
 *
 * 整合 useDrag、usePinch、useWheel，提供统一的手势管理接口。
 *
 * 特性：
 * - 统一的启用/禁用控制
 * - 手势冲突处理（如双指缩放时禁用拖拽）
 * - 双击检测
 * - 提供当前活动手势类型
 *
 * @param options - 配置选项
 * @returns 手势状态和控制方法
 *
 * @example
 * ```ts
 * const el = ref<HTMLElement | null>(null)
 *
 * const {
 *   isDragging,
 *   isPinching,
 *   isWheeling,
 *   isInteracting,
 *   activeGesture,
 *   stop,
 * } = useGesture({
 *   target: el,
 *   onDrag: (state) => {
 *     transform.pan(state.delta)
 *   },
 *   onPinch: (state) => {
 *     transform.zoomAt(initialScale * state.scale, state.center)
 *   },
 *   onWheel: (state) => {
 *     const newScale = currentScale + state.delta
 *     transform.zoomAt(newScale, state.center)
 *   },
 *   onDoubleClick: (position) => {
 *     zoom.toggleDoubleClickZoom()
 *   },
 * })
 * ```
 */
export function useGesture(options: UseGestureOptions): UseGestureReturn {
  const {
    target,
    enabled = true,
    enableDrag = true,
    enablePinch = true,
    enableWheel = true,
    enableGlobalZoom = false,
    wheelZoomRatio = 1,
    onDrag,
    onDragStart,
    onDragEnd,
    onPinch,
    onPinchStart,
    onPinchEnd,
    onWheel,
    onDoubleClick,
  } = options

  // 双击检测
  const doubleClickDetector = new DoubleClickDetector()

  // 清理函数
  const cleanupFns: (() => void)[] = []

  /**
   * 缩放手势（wheel / pinch）的事件目标
   *
   * 默认使用图片元素本身；当启用全局缩放后，在手势启用期间切换为 window。
   */
  const zoomEventTarget = (): EventTarget | null | undefined => {
    if (!toValue(enableGlobalZoom))
      return toValue(target)
    return toValue(enabled) ? window : null
  }

  // ===== 拖拽手势 =====
  const { isDragging, cancel: cancelDrag, stop: stopDrag } = useDrag({
    target,
    enabled: () => toValue(enabled) && toValue(enableDrag) && !isPinching.value,
    filter: (event) => {
      if (!onDoubleClick)
        return true

      const position = { x: event.clientX, y: event.clientY }
      const isDoubleClick = doubleClickDetector.detect(position)

      if (isDoubleClick) {
        onDoubleClick(position, event)
        return false
      }

      return true
    },
    onDragStart,
    onDrag,
    onDragEnd,
    preventDefault: true,
    pointerTypes: ['mouse', 'touch', 'pen'],
  })
  cleanupFns.push(stopDrag)

  // ===== 双指缩放 =====
  const { isPinching, stop: stopPinch } = usePinch({
    target: zoomEventTarget,
    enabled: () => toValue(enabled) && toValue(enablePinch),
    onPinchStart: (state) => {
      // 手势冲突：双指缩放开始时取消正在进行的拖拽
      cancelDrag()
      onPinchStart?.(state)
    },
    onPinch,
    onPinchEnd,
  })
  cleanupFns.push(stopPinch)

  // ===== 滚轮缩放 =====
  const { isWheeling, stop: stopWheel } = useWheel({
    target: zoomEventTarget,
    enabled: () => toValue(enabled) && toValue(enableWheel),
    zoomRatio: wheelZoomRatio,
    onWheel,
  })
  cleanupFns.push(stopWheel)

  // ===== 计算属性 =====

  /**
   * 是否有任何手势正在进行
   */
  const isInteracting = computed((): boolean => {
    return isDragging.value || isPinching.value || isWheeling.value
  })

  /**
   * 当前活动的手势类型
   */
  const activeGesture = computed((): GestureType => {
    if (isPinching.value)
      return 'pinch'
    if (isDragging.value)
      return 'drag'
    if (isWheeling.value)
      return 'wheel'
    return 'none'
  })

  /**
   * 停止所有手势监听
   */
  const stop = (): void => {
    for (const fn of cleanupFns) {
      fn()
    }
    cleanupFns.length = 0

    doubleClickDetector.reset()
  }

  // 自动清理
  tryOnScopeDispose(stop)

  return {
    isDragging: readonly(isDragging),
    isPinching: readonly(isPinching),
    isWheeling: readonly(isWheeling),
    isInteracting,
    activeGesture,
    stop,
  }
}
