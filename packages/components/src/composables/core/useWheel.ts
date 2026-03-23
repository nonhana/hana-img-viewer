import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Point } from '../../types/utils'
import { readonly, ref, toValue } from 'vue'
import { isClient, tryOnScopeDispose } from '../../utils/helpers'
import { useEventListener } from '../utils/useEventListener'

/**
 * 滚轮事件状态
 */
export interface WheelState {
  /** 缩放增量（正数放大，负数缩小） */
  delta: number
  /** 光标位置（缩放锚点） */
  center: Point
  /** 是否是触控板 */
  isTrackpad: boolean
  /** 原始事件 */
  event: WheelEvent
}

/**
 * useWheel 选项
 */
export interface UseWheelOptions {
  /**
   * 监听目标（元素 / window / document）
   */
  target: MaybeRefOrGetter<EventTarget | null | undefined>
  /**
   * 是否启用滚轮缩放
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * 滚轮事件回调
   */
  onWheel?: (state: WheelState) => void
  /**
   * 鼠标滚轮灵敏度
   * @default 0.002
   */
  mouseSensitivity?: number
  /**
   * 触控板灵敏度
   * @default 0.01
   */
  trackpadSensitivity?: number
  /**
   * 缩放系数（用于调整整体灵敏度）
   * @default 1
   */
  zoomRatio?: MaybeRefOrGetter<number>
  /**
   * 是否阻止默认行为
   * @default true
   */
  preventDefault?: boolean
}

/**
 * useWheel 返回值
 */
export interface UseWheelReturn {
  /** 是否正在滚动 */
  isWheeling: Readonly<Ref<boolean>>
  /** 停止监听 */
  stop: () => void
}

/**
 * 触控板检测器
 *
 * 触控板特征：
 * 1. deltaY 是小数（触控板通常产生小数值）
 * 2. 连续事件间隔短（< 50ms）
 * 3. delta 值较小（< 50）
 * 4. deltaMode 通常是 0（像素）
 */
class TrackpadDetector {
  private lastWheelTime = 0
  private consecutiveSmallDeltas = 0

  detect(event: WheelEvent): boolean {
    const now = Date.now()
    const timeDelta = now - this.lastWheelTime
    this.lastWheelTime = now

    const absY = Math.abs(event.deltaY)

    // 特征1：deltaY 是小数
    if (absY % 1 !== 0) {
      this.consecutiveSmallDeltas++
      return true
    }

    // 特征2 + 3：短间隔 + 小值
    if (timeDelta < 50 && absY < 50) {
      this.consecutiveSmallDeltas++
      if (this.consecutiveSmallDeltas > 2) {
        return true
      }
    }
    else {
      this.consecutiveSmallDeltas = 0
    }

    // 特征4：deltaMode 检查
    // 0 = 像素, 1 = 行, 2 = 页面
    // 鼠标滚轮通常是 1（行）或有较大的 deltaY
    if (event.deltaMode === 0 && absY < 100) {
      return true
    }

    return false
  }

  reset(): void {
    this.lastWheelTime = 0
    this.consecutiveSmallDeltas = 0
  }
}

/**
 * 滚轮缩放 composable
 *
 * 特性：
 * - 区分触控板和鼠标滚轮
 * - 根据设备类型调整灵敏度
 * - 提供光标位置作为缩放锚点
 * - 阻止默认滚动行为
 * - 使用 RAF 调度更新
 *
 * @param options - 配置选项
 * @returns 滚轮状态和控制方法
 *
 * @example
 * ```ts
 * const el = ref<HTMLElement | null>(null)
 *
 * const { isWheeling, stop } = useWheel({
 *   target: el,
 *   onWheel: (state) => {
 *     // state.delta 是缩放增量
 *     // state.center 是光标位置（缩放锚点）
 *     const newScale = currentScale + state.delta
 *     transform.zoomAt(newScale, state.center)
 *   },
 * })
 * ```
 */
export function useWheel(options: UseWheelOptions): UseWheelReturn {
  const {
    target,
    enabled = true,
    onWheel,
    mouseSensitivity = 0.002,
    trackpadSensitivity = 0.01,
    zoomRatio = 1,
    preventDefault = true,
  } = options

  // 状态
  const isWheeling = ref(false)

  // 内部状态
  const detector = new TrackpadDetector()
  let rafId: number | null = null
  let wheelEndTimer: ReturnType<typeof setTimeout> | null = null

  // 清理函数集合
  const cleanupFns: (() => void)[] = []

  /**
   * 处理滚轮事件
   */
  const handleWheel = (event: WheelEvent): void => {
    // 检查是否启用
    if (!toValue(enabled))
      return

    // 阻止默认行为（防止页面滚动）
    if (preventDefault)
      event.preventDefault()

    // 设置滚动状态
    isWheeling.value = true

    // 清除之前的结束计时器
    if (wheelEndTimer !== null) {
      clearTimeout(wheelEndTimer)
    }

    // 设置滚动结束检测
    wheelEndTimer = setTimeout(() => {
      isWheeling.value = false
      detector.reset()
    }, 150)

    // 使用 RAF 调度更新（避免过于频繁的更新）
    if (rafId !== null)
      return

    rafId = requestAnimationFrame(() => {
      rafId = null

      // 检测是否是触控板
      const isTrackpad = detector.detect(event)

      // 根据设备类型选择灵敏度
      const sensitivity = isTrackpad ? trackpadSensitivity : mouseSensitivity

      // 计算缩放增量
      // deltaY < 0 表示向上滚动（放大）
      // deltaY > 0 表示向下滚动（缩小）
      const delta = -event.deltaY * sensitivity * toValue(zoomRatio)

      // 获取光标位置
      const center: Point = {
        x: event.clientX,
        y: event.clientY,
      }

      // 触发回调
      const state: WheelState = {
        delta,
        center,
        isTrackpad,
        event,
      }
      onWheel?.(state)
    })
  }

  /**
   * 设置事件监听
   *
   * 注意：不需要检查 target 是否存在，因为 useEventListener
   * 内部使用 watch 来响应式地监听目标变化，会在目标可用时自动绑定事件。
   */
  const setup = (): void => {
    if (!isClient)
      return

    // 使用 passive: false 以便能够调用 preventDefault
    // useEventListener 会在 target 变为非空时自动绑定事件
    const { stop: stopWheel } = useEventListener(
      target,
      'wheel',
      evt => handleWheel(evt as WheelEvent),
      { passive: false },
    )
    cleanupFns.push(stopWheel)
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

    if (wheelEndTimer !== null) {
      clearTimeout(wheelEndTimer)
      wheelEndTimer = null
    }

    detector.reset()
  }

  /**
   * 停止监听
   */
  const stop = (): void => {
    cleanup()
    isWheeling.value = false
  }

  // 初始化
  setup()

  // 自动清理
  tryOnScopeDispose(stop)

  return {
    isWheeling: readonly(isWheeling),
    stop,
  }
}
