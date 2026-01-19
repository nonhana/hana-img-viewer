import type { Ref } from 'vue'

/**
 * VueUse 风格的类型工具
 * 支持 Ref、原始值或 Getter 函数
 */

/** 可能是 Ref 或原始值 */
export type MaybeRef<T> = T | Ref<T>

/** 可能是 Ref、原始值或 Getter 函数 */
export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)

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
