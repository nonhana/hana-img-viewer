import type { Ref } from 'vue'

// 获取目标元素的 transform 位置（初始化）
export function getTargetPosition(targetRef: Ref<HTMLElement | null>) {
  if (targetRef.value) {
    let X = 0
    let Y = 0
    const transform = window.getComputedStyle(targetRef.value).transform
    if (transform !== 'none') {
      const match = transform.match(/matrix\((.+)\)/)
      if (match) {
        const matrixValues = match[1].split(', ')
        X = Number.parseFloat(matrixValues[4]) || 0
        Y = Number.parseFloat(matrixValues[5]) || 0
      }
    }
    else {
      X = 0
      Y = 0
    }
    return [X, Y] as const
  }
  return [0, 0] as const
}
