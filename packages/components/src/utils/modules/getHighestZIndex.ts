/**
 * 获取当前页面中最高的 z-index 值
 * @param element 要检查的元素，会向上遍历其父元素
 * @returns 比当前最高 z-index 更高的值
 */
export function getHighestZIndex(element?: HTMLElement | null): number {
  let maxZIndex = 0

  // 检查指定元素及其父元素的 z-index
  if (element) {
    let current: HTMLElement | null = element
    while (current && current !== document.body) {
      const zIndex = window.getComputedStyle(current).zIndex
      if (zIndex !== 'auto' && zIndex !== '') {
        const numericZIndex = Number.parseInt(zIndex, 10)
        if (!Number.isNaN(numericZIndex)) {
          maxZIndex = Math.max(maxZIndex, numericZIndex)
        }
      }
      current = current.parentElement
    }
  }

  // 检查页面中所有元素的 z-index
  const elements = document.querySelectorAll('*')
  for (const el of elements) {
    const zIndex = window.getComputedStyle(el).zIndex
    if (zIndex !== 'auto' && zIndex !== '') {
      const numericZIndex = Number.parseInt(zIndex, 10)
      if (!Number.isNaN(numericZIndex)) {
        maxZIndex = Math.max(maxZIndex, numericZIndex)
      }
    }
  }

  // 返回比最高值还高的 z-index，最小值为 9999
  return Math.max(maxZIndex + 1, 9999)
}

/**
 * 检测元素是否在模态容器中（如 Dialog、Modal 等）
 * @param element 要检查的元素
 * @returns 是否在模态容器中
 */
export function isInModalContainer(element: HTMLElement | null): boolean {
  if (!element)
    return false

  let current: HTMLElement | null = element
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current)
    const classList = current.classList

    // 检查常见的模态容器特征
    if (
      style.position === 'fixed'
      || classList.contains('el-dialog')
      || classList.contains('ant-modal')
      || classList.contains('modal')
      || classList.contains('dialog')
      || (current.hasAttribute('role') && (
        current.getAttribute('role') === 'dialog'
        || current.getAttribute('role') === 'modal'
      ))
    ) {
      return true
    }

    current = current.parentElement
  }

  return false
}
