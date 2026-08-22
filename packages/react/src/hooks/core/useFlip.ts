import { useEffect, useRef, useState } from 'react'

export const DEFAULT_FLIP_DURATION = 300
export const DEFAULT_FLIP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

export interface UseFlipOptions {
  duration?: number
  easing?: string
  onStart?: () => void
  onFinish?: () => void
  onCancel?: () => void
}

export interface CurrentTransform {
  x: number
  y: number
  scale: number
}

export interface UseFlipReturn {
  isAnimating: boolean
  flip: (from: DOMRect, to: DOMRect, element: HTMLElement) => Promise<void>
  flipReverse: (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
    currentTransform?: CurrentTransform,
  ) => Promise<void>
  cancel: () => void
}

export const useFlip = (options: UseFlipOptions = {}): UseFlipReturn => {
  const {
    duration = DEFAULT_FLIP_DURATION,
    easing = DEFAULT_FLIP_EASING,
    onStart,
    onFinish,
    onCancel,
  } = options

  const [isAnimating, setIsAnimating] = useState(false)

  const currentAnimationRef = useRef<Animation | null>(null)
  const callbacksRef = useRef({ onStart, onFinish, onCancel })
  callbacksRef.current = { onStart, onFinish, onCancel }

  const cancel = (): void => {
    if (currentAnimationRef.current) {
      currentAnimationRef.current.cancel()
      currentAnimationRef.current = null
      setIsAnimating(false)
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

    setIsAnimating(true)
    callbacksRef.current.onStart?.()

    try {
      currentAnimationRef.current = element.animate(keyframes, {
        duration,
        easing,
        fill: 'forwards',
      })

      await currentAnimationRef.current.finished

      if (currentAnimationRef.current) {
        currentAnimationRef.current.commitStyles()
        currentAnimationRef.current.cancel()
      }

      callbacksRef.current.onFinish?.()
    }
    catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        callbacksRef.current.onCancel?.()
      }
      else {
        throw error
      }
    }
    finally {
      currentAnimationRef.current = null
      setIsAnimating(false)
    }
  }

  const flip = async (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
  ): Promise<void> => {
    const { deltaX, deltaY, scaleX, scaleY } = calculateFLIPTransform(from, to)

    await animate(element, [
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
      },
      {
        transform: 'translate(0, 0) scale(1, 1)',
      },
    ])
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

    await animate(element, [
      {
        transform: `translate(${startX}px, ${startY}px) scale(${startScale})`,
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
      },
    ])
  }

  // Cancel any in-flight animation on unmount.
  useEffect(
    () => () => {
      cancel()
    },
    [],
  )

  return {
    isAnimating,
    flip,
    flipReverse,
    cancel,
  }
}
