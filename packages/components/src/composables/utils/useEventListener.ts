import type { MaybeRefOrGetter } from 'vue'
import { toValue, watch } from 'vue'
import { tryOnScopeDispose } from '@/utils/helpers'

export interface UseEventListenerOptions extends AddEventListenerOptions {
  immediate?: boolean
}

export interface UseEventListenerReturn {
  stop: () => void
}

export function useEventListener<E extends keyof WindowEventMap>(
  target: MaybeRefOrGetter<Window | null | undefined>,
  event: E,
  handler: (evt: WindowEventMap[E]) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

export function useEventListener<E extends keyof DocumentEventMap>(
  target: MaybeRefOrGetter<Document | null | undefined>,
  event: E,
  handler: (evt: DocumentEventMap[E]) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

export function useEventListener<E extends keyof HTMLElementEventMap>(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  event: E,
  handler: (evt: HTMLElementEventMap[E]) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

export function useEventListener(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: string,
  handler: (evt: Event) => void,
  options?: UseEventListenerOptions,
): UseEventListenerReturn

export function useEventListener(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: string,
  handler: (evt: Event) => void,
  options: UseEventListenerOptions = {},
): UseEventListenerReturn {
  const { immediate = true, ...listenerOptions } = options

  let cleanup: (() => void) | undefined

  const register = (el: EventTarget | null | undefined) => {
    cleanup?.()
    cleanup = undefined

    if (!el)
      return

    el.addEventListener(event, handler, listenerOptions)
    cleanup = () => el.removeEventListener(event, handler, listenerOptions)
  }

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

  tryOnScopeDispose(stop)

  return { stop }
}
