/**
 * 阻止默认行为
 */
export function preventDefault(e: Event): void {
  // 检查是否在客户端环境
  if (typeof e === 'undefined' || typeof e.preventDefault !== 'function')
    return

  // 阻止事件默认行为
  e.preventDefault()
}
