/**
 * 获取元素的所有滚动父容器
 * @param element 目标元素
 * @returns 所有滚动父容器的数组
 */
export function getScrollParents(element: HTMLElement): HTMLElement[] {
  const scrollParents: HTMLElement[] = []
  let current: HTMLElement | null = element.parentElement

  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current)
    const { overflow, overflowX, overflowY } = style

    // 检查是否为滚动容器
    if (
      overflow === 'auto'
      || overflow === 'scroll'
      || overflowX === 'auto'
      || overflowX === 'scroll'
      || overflowY === 'auto'
      || overflowY === 'scroll'
    ) {
      scrollParents.push(current)
    }

    current = current.parentElement
  }

  return scrollParents
}

/**
 * 获取元素在所有滚动容器中的累计滚动偏移
 * @param element 目标元素
 * @returns 累计的滚动偏移 { x, y }
 */
export function getCumulativeScrollOffset(element: HTMLElement): { x: number, y: number } {
  const scrollParents = getScrollParents(element)
  let totalOffsetX = 0
  let totalOffsetY = 0

  for (const parent of scrollParents) {
    totalOffsetX += parent.scrollLeft
    totalOffsetY += parent.scrollTop
  }

  return {
    x: totalOffsetX,
    y: totalOffsetY,
  }
}

/**
 * 检测元素是否在固定定位的容器中
 * @param element 目标元素
 * @returns 是否在固定定位容器中
 */
export function isInFixedContainer(element: HTMLElement): boolean {
  let current: HTMLElement | null = element.parentElement

  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current)

    if (style.position === 'fixed') {
      return true
    }

    current = current.parentElement
  }

  return false
}

/**
 * 获取元素相对于视口的精确位置
 * 考虑所有滚动容器的偏移
 * @param element 目标元素
 * @returns 精确的位置信息
 */
export function getAccurateElementPosition(element: HTMLElement): {
  top: number
  left: number
  width: number
  height: number
} {
  const rect = element.getBoundingClientRect()

  // getBoundingClientRect 已经返回了相对于视口的正确位置
  // 对于固定定位的容器（如 Dialog），我们不需要额外的滚动偏移
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

/**
 * 获取元素的正确初始位置，考虑页面滚动和容器类型
 * @param element 目标元素
 * @param pageScrollX 页面水平滚动位置
 * @param pageScrollY 页面垂直滚动位置
 * @returns 正确的初始位置
 */
export function getCorrectInitialPosition(
  element: HTMLElement,
  pageScrollX: number,
  pageScrollY: number,
): { top: number, left: number } {
  const rect = element.getBoundingClientRect()
  const isFixed = isInFixedContainer(element)

  if (isFixed) {
    // 如果在固定定位容器中，直接使用 getBoundingClientRect 的结果
    // 不需要加页面滚动偏移，因为固定定位不受页面滚动影响
    return {
      top: rect.top,
      left: rect.left,
    }
  }
  else {
    // 如果在普通文档流中，需要加上页面滚动偏移
    return {
      top: rect.top + pageScrollY,
      left: rect.left + pageScrollX,
    }
  }
}

/**
 * 检测元素是否在滚动容器中
 * @param element 目标元素
 * @returns 是否在滚动容器中
 */
export function isInScrollContainer(element: HTMLElement): boolean {
  return getScrollParents(element).length > 0
}
