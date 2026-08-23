import type { MaybeRefOrGetter, Ref } from 'vue'
import { readonly, ref, toValue } from 'vue'
import { tryOnScopeDispose } from '@/utils/helpers'

export const DEFAULT_FLIP_DURATION = 300
export const DEFAULT_FLIP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

export interface UseFLIPOptions {
  duration?: MaybeRefOrGetter<number>
  easing?: MaybeRefOrGetter<string>
  onStart?: () => void
  onFinish?: () => void
  onCancel?: () => void
}

export interface CurrentTransform {
  x: number
  y: number
  scale: number
}

export interface UseFLIPReturn {
  isAnimating: Readonly<Ref<boolean>>
  flip: (from: DOMRect, to: DOMRect, element: HTMLElement) => Promise<void>
  flipReverse: (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
    currentTransform?: CurrentTransform,
  ) => Promise<void>
  cancel: () => void
}

export const useFLIP = (options: UseFLIPOptions = {}): UseFLIPReturn => {
  const {
    duration = DEFAULT_FLIP_DURATION,
    easing = DEFAULT_FLIP_EASING,
    onStart,
    onFinish,
    onCancel,
  } = options

  const isAnimating = ref(false)

  let currentAnimation: Animation | null = null

  const cancel = (): void => {
    if (currentAnimation) {
      currentAnimation.cancel()
      currentAnimation = null
      isAnimating.value = false
    }
  }

  const calculateFLIPTransform = (from: DOMRect, to: DOMRect) => {
    const deltaX = from.left + from.width / 2 - (to.left + to.width / 2)
    const deltaY = from.top + from.height / 2 - (to.top + to.height / 2)

    const scaleX = from.width / to.width
    const scaleY = from.height / to.height

    return { deltaX, deltaY, scaleX, scaleY }
  }

  const animate = async (
    element: HTMLElement,
    keyframes: Keyframe[],
  ): Promise<void> => {
    cancel()

    isAnimating.value = true
    onStart?.()

    const anim = element.animate(keyframes, {
      duration: toValue(duration),
      easing: toValue(easing),
      fill: 'forwards',
    })
    currentAnimation = anim

    try {
      await anim.finished

      if (currentAnimation === anim) {
        currentAnimation.commitStyles()
        currentAnimation.cancel()
      }

      onFinish?.()
    }
    catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        onCancel?.()
      }
      else {
        throw error
      }
    }
    finally {
      // Only the owning animation clears the slot; a newer animation may
      // have superseded this one while its AbortError was in flight.
      if (currentAnimation === anim) {
        currentAnimation = null
        isAnimating.value = false
      }
    }
  }

  const flip = async (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
  ): Promise<void> => {
    const { deltaX, deltaY, scaleX, scaleY } = calculateFLIPTransform(from, to)

    const keyframes: Keyframe[] = [
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
      },
      {
        transform: 'translate(0, 0) scale(1, 1)',
      },
    ]

    await animate(element, keyframes)
  }

  const flipReverse = async (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
    currentTransform?: CurrentTransform,
  ): Promise<void> => {
    const { deltaX, deltaY, scaleX, scaleY } = calculateFLIPTransform(to, from)

    const startX = currentTransform?.x ?? 0
    const startY = currentTransform?.y ?? 0
    const startScale = currentTransform?.scale ?? 1

    const endX = deltaX
    const endY = deltaY

    const keyframes: Keyframe[] = [
      {
        transform: `translate(${startX}px, ${startY}px) scale(${startScale})`,
      },
      {
        transform: `translate(${endX}px, ${endY}px) scale(${scaleX}, ${scaleY})`,
      },
    ]

    await animate(element, keyframes)
  }

  tryOnScopeDispose(cancel)

  return {
    isAnimating: readonly(isAnimating),
    flip,
    flipReverse,
    cancel,
  }
}
