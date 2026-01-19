import type { Ref } from 'vue'
import type { MaybeRefOrGetter } from '../../types/utils'
import { readonly, ref } from 'vue'
import { isClient, toValue, tryOnScopeDispose } from '../../utils/helpers'

/**
 * useScrollLock 返回值
 */
export interface UseScrollLockReturn {
  /** 当前是否锁定 */
  isLocked: Readonly<Ref<boolean>>
  /** 锁定滚动 */
  lock: () => void
  /** 解锁滚动 */
  unlock: () => void
  /** 切换锁定状态 */
  toggle: () => void
}

/**
 * 滚动锁定 composable
 *
 * 特性：
 * - 保存并恢复原始 overflow 值
 * - 计算滚动条宽度，添加 padding-right 防止页面抖动
 * - 支持自定义锁定目标元素
 * - 自动在 scope 销毁时解锁
 *
 * @param target - 要锁定滚动的元素（默认 document.body）
 * @returns 锁定状态和控制方法
 *
 * @example
 * ```ts
 * const { isLocked, lock, unlock, toggle } = useScrollLock()
 *
 * // 打开模态框时锁定
 * lock()
 *
 * // 关闭模态框时解锁
 * unlock()
 *
 * // 切换锁定状态
 * toggle()
 * ```
 */
export function useScrollLock(
  target: MaybeRefOrGetter<HTMLElement | null | undefined> = () => isClient ? document.body : null,
): UseScrollLockReturn {
  const isLocked = ref(false)

  // 保存原始样式
  let originalOverflow = ''
  let originalPaddingRight = ''

  /**
   * 计算滚动条宽度
   */
  const getScrollbarWidth = (): number => {
    if (!isClient)
      return 0
    return window.innerWidth - document.documentElement.clientWidth
  }

  /**
   * 锁定滚动
   */
  const lock = (): void => {
    const el = toValue(target)
    if (!el || isLocked.value)
      return

    // 保存原始样式
    originalOverflow = el.style.overflow
    originalPaddingRight = el.style.paddingRight

    // 计算滚动条宽度
    const scrollbarWidth = getScrollbarWidth()

    // 应用锁定样式
    el.style.overflow = 'hidden'

    // 添加 padding-right 补偿滚动条宽度，防止页面抖动
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseInt(getComputedStyle(el).paddingRight, 10) || 0
      el.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }

    isLocked.value = true
  }

  /**
   * 解锁滚动
   */
  const unlock = (): void => {
    const el = toValue(target)
    if (!el || !isLocked.value)
      return

    // 恢复原始样式
    el.style.overflow = originalOverflow
    el.style.paddingRight = originalPaddingRight

    isLocked.value = false
  }

  /**
   * 切换锁定状态
   */
  const toggle = (): void => {
    if (isLocked.value) {
      unlock()
    }
    else {
      lock()
    }
  }

  // 自动在 scope 销毁时解锁
  tryOnScopeDispose(unlock)

  return {
    isLocked: readonly(isLocked),
    lock,
    unlock,
    toggle,
  }
}
