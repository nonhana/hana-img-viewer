import { getCurrentScope, onScopeDispose } from 'vue'

/**
 * 检测是否在客户端环境（浏览器）
 */
export const isClient = typeof window !== 'undefined'

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
 * 在当前 Vue effect 作用域销毁时执行清理函数
 *
 * 若不存在对应作用域，则返回 false
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
