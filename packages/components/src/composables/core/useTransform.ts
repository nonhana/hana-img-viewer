import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { Bounds, Point, Transform } from '../../types/utils'
import { computed, readonly, ref, toValue } from 'vue'
import { clamp } from '../../utils/helpers'
import { getZoomAnchoredPosition } from '../../utils/math'

/**
 * useTransform 选项
 */
export interface UseTransformOptions {
  /**
   * 初始变换状态
   */
  initial?: Partial<Transform>
  /**
   * 边界限制（可选）
   * 提供时会限制 x, y 的范围
   */
  bounds?: MaybeRefOrGetter<Bounds | null>
  /**
   * 缩放范围限制
   */
  scaleRange?: MaybeRefOrGetter<{ min: number, max: number } | null>
  /**
   * 变换变化回调
   */
  onChange?: (transform: Transform) => void
}

/**
 * useTransform 返回值
 */
export interface UseTransformReturn {
  /** 当前变换状态（只读） */
  transform: Readonly<Ref<Transform>>
  /** CSS transform 字符串 */
  style: ComputedRef<string>
  /** 设置变换（部分更新） */
  set: (partial: Partial<Transform>) => void
  /** 以某点为锚点缩放 */
  zoomAt: (newScale: number, anchor: Point) => void
  /** 平移 */
  pan: (delta: Point) => void
  /** 旋转 */
  rotate: (degrees: number) => void
  /** 重置到初始状态 */
  reset: () => void
  /** 获取当前变换的副本 */
  getSnapshot: () => Transform
}

/**
 * 默认变换状态
 */
const DEFAULT_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
}

/**
 * 变换矩阵管理 composable
 *
 * 特性：
 * - 管理 { x, y, scale, rotate } 变换状态
 * - 提供 CSS transform 字符串计算
 * - 支持边界限制和缩放范围限制
 * - 支持以锚点为中心的缩放
 * - 变换变化回调
 *
 * @param options - 配置选项
 * @returns 变换状态和控制方法
 *
 * @example
 * ```ts
 * const { transform, style, set, zoomAt, pan, reset } = useTransform({
 *   initial: { scale: 1 },
 *   scaleRange: { min: 0.5, max: 10 },
 * })
 *
 * // 以光标位置为锚点缩放
 * zoomAt(2, { x: mouseX, y: mouseY })
 *
 * // 平移
 * pan({ x: 10, y: 5 })
 *
 * // 应用到元素
 * <div :style="{ transform: style }">...</div>
 * ```
 */
export function useTransform(options: UseTransformOptions = {}): UseTransformReturn {
  const {
    initial = {},
    bounds,
    scaleRange,
    onChange,
  } = options

  // 合并初始值
  const initialTransform: Transform = {
    ...DEFAULT_TRANSFORM,
    ...initial,
  }

  // 内部状态
  const transform = ref<Transform>({ ...initialTransform })

  /**
   * 应用边界限制
   */
  const applyBounds = (t: Transform): Transform => {
    const b = toValue(bounds)
    if (!b)
      return t

    return {
      ...t,
      x: clamp(t.x, b.minX, b.maxX),
      y: clamp(t.y, b.minY, b.maxY),
    }
  }

  /**
   * 应用缩放范围限制
   */
  const applyScaleRange = (scale: number): number => {
    const range = toValue(scaleRange)
    if (!range)
      return scale

    return clamp(scale, range.min, range.max)
  }

  /**
   * 更新变换状态（内部方法）
   */
  const updateTransform = (newTransform: Transform): void => {
    // 应用缩放限制
    newTransform.scale = applyScaleRange(newTransform.scale)

    // 应用边界限制
    newTransform = applyBounds(newTransform)

    // 更新状态
    transform.value = newTransform

    // 触发回调
    onChange?.(newTransform)
  }

  /**
   * CSS transform 字符串
   */
  const style = computed((): string => {
    const { x, y, scale, rotate } = transform.value
    // 使用 translate3d 开启 GPU 加速
    return `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`
  })

  /**
   * 设置变换（部分更新）
   */
  const set = (partial: Partial<Transform>): void => {
    updateTransform({
      ...transform.value,
      ...partial,
    })
  }

  /**
   * 以某点为锚点缩放
   * 使锚点在视觉上保持不动
   */
  const zoomAt = (newScale: number, anchor: Point): void => {
    const current = transform.value
    const clampedScale = applyScaleRange(newScale)

    // 如果缩放没有变化，直接返回
    if (clampedScale === current.scale)
      return

    // 计算以锚点为中心缩放后的新位置
    const newPos = getZoomAnchoredPosition(
      { x: current.x, y: current.y },
      anchor,
      current.scale,
      clampedScale,
    )

    updateTransform({
      ...current,
      x: newPos.x,
      y: newPos.y,
      scale: clampedScale,
    })
  }

  /**
   * 平移
   */
  const pan = (delta: Point): void => {
    const current = transform.value
    updateTransform({
      ...current,
      x: current.x + delta.x,
      y: current.y + delta.y,
    })
  }

  /**
   * 旋转
   */
  const rotate = (degrees: number): void => {
    const current = transform.value
    updateTransform({
      ...current,
      rotate: current.rotate + degrees,
    })
  }

  /**
   * 重置到初始状态
   */
  const reset = (): void => {
    updateTransform({ ...initialTransform })
  }

  /**
   * 获取当前变换的副本
   */
  const getSnapshot = (): Transform => {
    return { ...transform.value }
  }

  return {
    transform: readonly(transform),
    style,
    set,
    zoomAt,
    pan,
    rotate,
    reset,
    getSnapshot,
  }
}
