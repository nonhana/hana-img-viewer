import type { MaybeRefOrGetter } from 'vue'
import { toValue, watch } from 'vue'
import { tryOnScopeDispose } from '@/utils/helpers'

/**
 * 事件监听选项
 */
export interface UseEventListenerOptions extends AddEventListenerOptions {
  /**
   * 是否立即绑定事件
   * @default true
   */
  immediate?: boolean
}

/**
 * 事件监听返回值
 */
export interface UseEventListenerReturn {
  /** 停止监听 */
  stop: () => void
}

// 函数重载：Window 事件
export function useEventListener<E extends keyof WindowEventMap>(
  target: MaybeRefOrGetter<Window | null | undefined>,
  event: E,
  handler: (evt: WindowEventMap[E]) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

// 函数重载：Document 事件
export function useEventListener<E extends keyof DocumentEventMap>(
  target: MaybeRefOrGetter<Document | null | undefined>,
  event: E,
  handler: (evt: DocumentEventMap[E]) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

// 函数重载：HTMLElement 事件
export function useEventListener<E extends keyof HTMLElementEventMap>(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  event: E,
  handler: (evt: HTMLElementEventMap[E]) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

// 函数重载：通用 EventTarget
export function useEventListener(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: string,
  handler: (evt: Event) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

/**
 * VueUse 风格的事件监听 composable
 *
 * 特性：
 * - 支持 Ref、Getter 或原始值作为目标
 * - 自动在 scope 销毁时清理
 * - 响应式监听目标变化
 * - 返回手动 stop 函数
 *
 * @param target - 事件目标（支持 MaybeRefOrGetter）
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * @param options - 事件监听选项
 * @returns 包含 stop 方法的对象
 *
 * @example
 * ```ts
 * // 监听 window resize
 * useEventListener(window, 'resize', () => {
 *   console.log('resized')
 * })
 *
 * // 监听 Ref 元素
 * const el = ref<HTMLElement | null>(null)
 * useEventListener(el, 'click', (e) => {
 *   console.log('clicked', e)
 * })
 *
 * // 手动停止监听
 * const { stop } = useEventListener(window, 'scroll', handler)
 * stop()
 * ```
 */
export function useEventListener(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: string,
  handler: (evt: Event) => void,
  options: UseEventListenerOptions = {},
): UseEventListenerReturn {
  const { immediate = true, ...listenerOptions } = options

  let cleanup: (() => void) | undefined

  const register = (el: EventTarget | null | undefined) => {
    // 清理之前的监听
    cleanup?.()
    cleanup = undefined

    if (!el)
      return

    el.addEventListener(event, handler, listenerOptions)
    cleanup = () => el.removeEventListener(event, handler, listenerOptions)
  }

  // 监听目标变化
  const stopWatch = watch(
    () => toValue(target),
    register,
    { immediate },
  )

  const stop = () => {
    stopWatch()
    cleanup?.()
    cleanup = undefined
  }

  // 自动在 scope 销毁时清理
  tryOnScopeDispose(stop)

  return { stop }
}
