import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { Point } from '../../types/utils'
import { computed, ref, toValue, watch } from 'vue'
import { clamp } from '../../utils/helpers'

/**
 * useZoom 选项
 */
export interface UseZoomOptions {
  /**
   * 初始缩放级别
   * @default 1
   */
  initialZoom?: number
  /**
   * 最小缩放
   * @default 0.1
   */
  minZoom?: MaybeRefOrGetter<number>
  /**
   * 最大缩放
   * @default 10
   */
  maxZoom?: MaybeRefOrGetter<number>
  /**
   * 缩放步长（用于 zoomIn/zoomOut）
   * @default 0.5
   */
  step?: MaybeRefOrGetter<number>
  /**
   * 双击缩放目标值
   * @default 2
   */
  doubleClickZoom?: MaybeRefOrGetter<number>
  /**
   * 缩放变化回调
   */
  onZoomChange?: (zoom: number) => void
}

/**
 * useZoom 返回值
 */
export interface UseZoomReturn {
  /** 当前缩放级别 */
  zoom: Ref<number>
  /** 放大（按步长） */
  zoomIn: (options?: { center?: Point }) => void
  /** 缩小（按步长） */
  zoomOut: (options?: { center?: Point }) => void
  /** 设置缩放值 */
  setZoom: (value: number, options?: { center?: Point }) => void
  /** 双击缩放切换 */
  toggleDoubleClickZoom: (options?: { center?: Point }) => void
  /** 重置缩放 */
  reset: () => void
  /** 是否可以放大 */
  canZoomIn: ComputedRef<boolean>
  /** 是否可以缩小 */
  canZoomOut: ComputedRef<boolean>
  /** 是否处于初始缩放 */
  isInitialZoom: ComputedRef<boolean>
}

/**
 * 缩放逻辑 composable
 *
 * 特性：
 * - 管理缩放级别状态
 * - 提供 zoomIn/zoomOut/setZoom 方法
 * - 支持最小/最大缩放限制
 * - 支持双击缩放切换
 * - 缩放变化回调
 *
 * 注意：此 composable 仅管理缩放数值，不负责实际的位置计算。
 * 位置计算（如以锚点缩放）应由 useTransform 处理。
 *
 * @param options - 配置选项
 * @returns 缩放状态和控制方法
 *
 * @example
 * ```ts
 * const {
 *   zoom,
 *   zoomIn,
 *   zoomOut,
 *   setZoom,
 *   toggleDoubleClickZoom,
 *   canZoomIn,
 *   canZoomOut,
 * } = useZoom({
 *   minZoom: 0.5,
 *   maxZoom: 10,
 *   step: 0.5,
 *   onZoomChange: (z) => console.log('zoom:', z),
 * })
 *
 * // 放大
 * zoomIn()
 *
 * // 设置特定缩放值
 * setZoom(2)
 *
 * // 双击切换
 * toggleDoubleClickZoom()
 * ```
 */
export function useZoom(options: UseZoomOptions = {}): UseZoomReturn {
  const {
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 10,
    step = 0.5,
    doubleClickZoom = 2,
    onZoomChange,
  } = options

  // 内部状态
  const zoom = ref(initialZoom)

  // 用于双击切换的状态：记录双击前的缩放值
  let zoomBeforeDoubleClick: number | null = null

  /**
   * 限制缩放值在有效范围内
   */
  const clampZoom = (value: number): number => {
    return clamp(value, toValue(minZoom), toValue(maxZoom))
  }

  /**
   * 监听缩放变化并触发回调
   */
  watch(zoom, (newZoom) => {
    onZoomChange?.(newZoom)
  })

  /**
   * 设置缩放值
   */
  const setZoom = (value: number, _options?: { center?: Point }): void => {
    zoom.value = clampZoom(value)
    // center 参数由调用方处理位置计算
  }

  /**
   * 放大（按步长）
   */
  const zoomIn = (options?: { center?: Point }): void => {
    setZoom(zoom.value + toValue(step), options)
  }

  /**
   * 缩小（按步长）
   */
  const zoomOut = (options?: { center?: Point }): void => {
    setZoom(zoom.value - toValue(step), options)
  }

  /**
   * 双击缩放切换
   * - 如果当前是初始缩放，放大到 doubleClickZoom
   * - 如果当前不是初始缩放，恢复到初始缩放
   */
  const toggleDoubleClickZoom = (_options?: { center?: Point }): void => {
    const target = toValue(doubleClickZoom)

    // 如果当前接近初始缩放，则放大
    if (Math.abs(zoom.value - initialZoom) < 0.01) {
      zoomBeforeDoubleClick = zoom.value
      setZoom(target)
    }
    else {
      // 否则恢复到初始缩放
      setZoom(zoomBeforeDoubleClick ?? initialZoom)
      zoomBeforeDoubleClick = null
    }
  }

  /**
   * 重置缩放
   */
  const reset = (): void => {
    zoom.value = initialZoom
    zoomBeforeDoubleClick = null
  }

  /**
   * 是否可以放大
   */
  const canZoomIn = computed((): boolean => {
    return zoom.value < toValue(maxZoom)
  })

  /**
   * 是否可以缩小
   */
  const canZoomOut = computed((): boolean => {
    return zoom.value > toValue(minZoom)
  })

  /**
   * 是否处于初始缩放
   */
  const isInitialZoom = computed((): boolean => {
    return Math.abs(zoom.value - initialZoom) < 0.01
  })

  return {
    zoom,
    zoomIn,
    zoomOut,
    setZoom,
    toggleDoubleClickZoom,
    reset,
    canZoomIn,
    canZoomOut,
    isInitialZoom,
  }
}
