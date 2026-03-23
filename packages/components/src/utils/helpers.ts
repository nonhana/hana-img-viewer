import { getCurrentScope, onScopeDispose } from 'vue'

/**
 * 检测是否在客户端环境（浏览器）
 */
export const isClient = typeof window !== 'undefined'

/**
 * 检测是否在服务端环境（SSR）
 */
export const isServer = !isClient

/**
 * 空函数，用于默认回调
 */
export function noop(): void {}

/**
 * 将数值限制在指定范围内
 *
 * @param value - 要限制的值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的值
 *
 * @example
 * ```ts
 * clamp(5, 0, 10) // 5
 * clamp(-1, 0, 10) // 0
 * clamp(15, 0, 10) // 10
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 检查浏览器是否支持某个 API
 *
 * @param api - 要检查的 API 名称
 * @returns 是否支持
 */
export function isSupported(api: string): boolean {
  if (!isClient)
    return false
  return api in window
}

/**
 * 安全地获取元素的 BoundingClientRect
 * 在 SSR 环境或元素不存在时返回 null
 *
 * @param el - 目标元素
 * @returns DOMRect 或 null
 */
export function safeGetBoundingClientRect(
  el: HTMLElement | null | undefined,
): DOMRect | null {
  if (!isClient || !el)
    return null
  return el.getBoundingClientRect()
}

/**
 * 在当前作用域销毁时执行清理函数
 * 如果不在 Vue 作用域中，返回 false（用于测试或非组件环境）
 *
 * @param fn - 清理函数
 * @returns 是否成功注册清理函数
 */
export function tryOnScopeDispose(fn: () => void): boolean {
  if (getCurrentScope()) {
    onScopeDispose(fn)
    return true
  }
  return false
}
