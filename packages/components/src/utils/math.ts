import type { Point, Size } from '@/types/utils'

/**
 * 计算两点之间的距离
 *
 * @param p1 - 第一个点
 * @param p2 - 第二个点
 * @returns 两点之间的距离
 *
 * @example
 * ```ts
 * getDistance({ x: 0, y: 0 }, { x: 3, y: 4 }) // 5
 * ```
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.hypot(dx, dy)
}

/**
 * 计算两点的中点
 *
 * @param p1 - 第一个点
 * @param p2 - 第二个点
 * @returns 两点的中点坐标
 *
 * @example
 * ```ts
 * getMidpoint({ x: 0, y: 0 }, { x: 4, y: 4 }) // { x: 2, y: 2 }
 * ```
 */
export function getMidpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/**
 * 获取 DOMRect 的中心点
 *
 * @param rect - DOMRect 对象
 * @returns 矩形的中心点坐标
 *
 * @example
 * ```ts
 * const rect = element.getBoundingClientRect()
 * getRectCenter(rect) // { x: centerX, y: centerY }
 * ```
 */
export function getRectCenter(rect: DOMRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

/**
 * 获取 DOMRect 的尺寸
 *
 * @param rect - DOMRect 对象
 * @returns 矩形的尺寸
 */
export function getRectSize(rect: DOMRect): Size {
  return {
    width: rect.width,
    height: rect.height,
  }
}

/**
 * 计算保持宽高比的缩放尺寸
 * 使图片适应容器，同时保持原始宽高比
 *
 * @param originalSize - 原始尺寸
 * @param containerSize - 容器尺寸
 * @param contain - true: contain 模式（完整显示），false: cover 模式（填满容器）
 * @returns 缩放后的尺寸
 *
 * @example
 * ```ts
 * // 1000x500 的图片放入 400x400 的容器（contain 模式）
 * getScaledSize({ width: 1000, height: 500 }, { width: 400, height: 400 })
 * // { width: 400, height: 200 }
 * ```
 */
export function getScaledSize(
  originalSize: Size,
  containerSize: Size,
  contain: boolean = true,
): Size {
  const widthRatio = containerSize.width / originalSize.width
  const heightRatio = containerSize.height / originalSize.height

  const ratio = contain
    ? Math.min(widthRatio, heightRatio)
    : Math.max(widthRatio, heightRatio)

  return {
    width: originalSize.width * ratio,
    height: originalSize.height * ratio,
  }
}

/**
 * 计算以指定点为锚点缩放后的新位置
 * 用于实现以光标/触摸点为中心的缩放
 *
 * 这个函数适用于图片居中显示（使用 flex 或其他方式居中）的场景：
 * - 图片初始位置在视口中心
 * - transform: translate(x, y) 是相对于视口中心的偏移
 * - anchor 是视口绝对坐标（如 event.clientX/Y）
 *
 * @param currentPos - 当前 translate 偏移
 * @param anchor - 缩放锚点（光标/触摸点在视口中的绝对位置）
 * @param currentScale - 当前缩放比例
 * @param newScale - 新的缩放比例
 * @param viewportCenter - 视口中心点（可选，默认使用 window 尺寸计算）
 * @returns 新的 translate 偏移
 *
 * @example
 * ```ts
 * // 当前偏移 (0, 0)，以鼠标位置 (600, 400) 为锚点，从 1x 放大到 2x
 * // 视口中心为 (500, 400)
 * getZoomAnchoredPosition(
 *   { x: 0, y: 0 },
 *   { x: 600, y: 400 },
 *   1,
 *   2
 * )
 * // 返回新的偏移，使得鼠标指向的图片内容在视觉上保持不动
 * ```
 */
export function getZoomAnchoredPosition(
  currentPos: Point,
  anchor: Point,
  currentScale: number,
  newScale: number,
  viewportCenter?: Point,
): Point {
  const ratio = newScale / currentScale

  // 如果未提供视口中心，使用 window 尺寸计算
  // 注意：在 SSR 环境中需要提供 viewportCenter
  const center = viewportCenter ?? {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  }

  // 锚点相对于视口中心的偏移
  const anchorOffset = {
    x: anchor.x - center.x,
    y: anchor.y - center.y,
  }

  // 新的 translate 偏移
  // 公式推导：
  // 1. 图片中心在视口中的位置 = center + currentPos
  // 2. 锚点相对于图片中心的偏移 = anchor - (center + currentPos) = anchorOffset - currentPos
  // 3. 缩放后，这个偏移会按比例变化
  // 4. 为了让锚点保持不动，需要调整 translate
  return {
    x: anchorOffset.x * (1 - ratio) + currentPos.x * ratio,
    y: anchorOffset.y * (1 - ratio) + currentPos.y * ratio,
  }
}

/**
 * 线性插值
 *
 * @param start - 起始值
 * @param end - 结束值
 * @param t - 插值因子（0-1）
 * @returns 插值结果
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * 二维点的线性插值
 *
 * @param p1 - 起始点
 * @param p2 - 结束点
 * @param t - 插值因子（0-1）
 * @returns 插值后的点
 */
export function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  }
}
