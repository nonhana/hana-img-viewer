/**
 * 二维坐标点
 */
export interface Point {
  x: number
  y: number
}

/**
 * 尺寸
 */
export interface Size {
  width: number
  height: number
}

/**
 * 边界限制
 */
export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * 变换状态
 */
export interface Transform {
  x: number
  y: number
  scale: number
  rotate: number
}

/**
 * 默认变换状态
 */
export const DEFAULT_TRANSFORM: Readonly<Transform> = {
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
}
