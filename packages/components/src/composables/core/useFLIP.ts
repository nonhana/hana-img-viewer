import type { MaybeRefOrGetter, Ref } from 'vue'
import { readonly, ref, toValue } from 'vue'
import { tryOnScopeDispose } from '../../utils/helpers'

/**
 * FLIP 动画选项
 */
export interface UseFLIPOptions {
  /**
   * 动画时长 (ms)
   * @default 300
   */
  duration?: MaybeRefOrGetter<number>
  /**
   * 缓动函数
   * @default 'cubic-bezier(0.4, 0, 0.2, 1)'
   */
  easing?: MaybeRefOrGetter<string>
  /**
   * 动画开始回调
   */
  onStart?: () => void
  /**
   * 动画结束回调
   */
  onFinish?: () => void
  /**
   * 动画取消回调
   */
  onCancel?: () => void
}

/**
 * 当前 transform 状态（用于 flipReverse）
 */
export interface CurrentTransform {
  x: number
  y: number
  scale: number
}

/**
 * useFLIP 返回值
 */
export interface UseFLIPReturn {
  /** 是否正在动画中 */
  isAnimating: Readonly<Ref<boolean>>
  /**
   * 执行 FLIP 动画
   * @param from - 起始位置
   * @param to - 结束位置
   * @param element - 目标元素
   * @returns 动画完成的 Promise
   */
  flip: (from: DOMRect, to: DOMRect, element: HTMLElement) => Promise<void>
  /**
   * 执行反向 FLIP 动画（关闭时使用）
   * @param from - 当前位置（未应用 currentTransform 的基准位置）
   * @param to - 目标位置
   * @param element - 目标元素
   * @param currentTransform - 当前的 transform 状态（可选，用于正确计算起始帧）
   * @returns 动画完成的 Promise
   */
  flipReverse: (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
    currentTransform?: CurrentTransform,
  ) => Promise<void>
  /** 取消当前动画 */
  cancel: () => void
}

/**
 * FLIP 动画 composable
 *
 * FLIP 动画原理：
 * 1. First - 记录元素初始位置
 * 2. Last - 记录元素最终位置
 * 3. Invert - 计算差值，应用反向 transform
 * 4. Play - 移除 transform，触发动画
 *
 * 特性：
 * - 使用 Web Animations API
 * - 支持 Promise 等待动画完成
 * - 支持取消动画
 * - 支持自定义时长和缓动
 *
 * @param options - 配置选项
 * @returns 动画状态和控制方法
 *
 * @example
 * ```ts
 * const { isAnimating, flip, flipReverse, cancel } = useFLIP({
 *   duration: 300,
 *   easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
 *   onStart: () => console.log('动画开始'),
 *   onFinish: () => console.log('动画结束'),
 * })
 *
 * // 打开预览时执行 FLIP
 * const thumbnailRect = thumbnail.getBoundingClientRect()
 * isOpen.value = true
 * await nextTick()
 * const previewRect = preview.getBoundingClientRect()
 * await flip(thumbnailRect, previewRect, preview)
 *
 * // 关闭预览时执行反向 FLIP
 * const currentRect = preview.getBoundingClientRect()
 * await flipReverse(currentRect, thumbnailRect, preview)
 * isOpen.value = false
 * ```
 */
export function useFLIP(options: UseFLIPOptions = {}): UseFLIPReturn {
  const {
    duration = 300,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    onStart,
    onFinish,
    onCancel,
  } = options

  // 状态
  const isAnimating = ref(false)

  // 当前动画实例
  let currentAnimation: Animation | null = null

  /**
   * 取消当前动画
   */
  const cancel = (): void => {
    if (currentAnimation) {
      currentAnimation.cancel()
      currentAnimation = null
      isAnimating.value = false
    }
  }

  /**
   * 计算 FLIP 变换值
   */
  const calculateFLIPTransform = (from: DOMRect, to: DOMRect) => {
    // 位置差值
    const deltaX = from.left + from.width / 2 - (to.left + to.width / 2)
    const deltaY = from.top + from.height / 2 - (to.top + to.height / 2)

    // 缩放比例
    const scaleX = from.width / to.width
    const scaleY = from.height / to.height

    return { deltaX, deltaY, scaleX, scaleY }
  }

  /**
   * 执行动画
   */
  const animate = async (
    element: HTMLElement,
    keyframes: Keyframe[],
  ): Promise<void> => {
    // 取消之前的动画
    cancel()

    isAnimating.value = true
    onStart?.()

    try {
      currentAnimation = element.animate(keyframes, {
        duration: toValue(duration),
        easing: toValue(easing),
        fill: 'forwards',
      })

      await currentAnimation.finished

      if (currentAnimation) {
        currentAnimation.commitStyles()
        currentAnimation.cancel()
      }

      // 动画完成回调
      onFinish?.()
    }
    catch (error) {
      // 动画被取消
      if (error instanceof DOMException && error.name === 'AbortError') {
        onCancel?.()
      }
      else {
        throw error
      }
    }
    finally {
      currentAnimation = null
      isAnimating.value = false
    }
  }

  /**
   * 执行 FLIP 动画（打开时使用）
   *
   * 从 from 位置动画到 to 位置
   * 元素应已在 to 位置，动画会从 from 过渡到当前位置
   */
  const flip = async (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
  ): Promise<void> => {
    const { deltaX, deltaY, scaleX, scaleY } = calculateFLIPTransform(from, to)

    // 关键帧：从反向变换到正常
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

  /**
   * 执行反向 FLIP 动画（关闭时使用）
   *
   * 从 from 位置动画到 to 位置
   * 元素应在 from 位置，动画会过渡到 to 位置
   *
   * @param from - 元素的基准位置（未应用 currentTransform 时的位置）
   * @param to - 目标位置（缩略图位置）
   * @param element - 目标元素
   * @param currentTransform - 当前的 transform 状态，用于正确计算起始帧
   */
  const flipReverse = async (
    from: DOMRect,
    to: DOMRect,
    element: HTMLElement,
    currentTransform?: CurrentTransform,
  ): Promise<void> => {
    // 计算目标变换（from 到 to 的差值）
    const { deltaX, deltaY, scaleX, scaleY } = calculateFLIPTransform(to, from)

    // 构建起始帧：如果提供了 currentTransform，从当前状态开始
    // 否则假设从 translate(0, 0) scale(1) 开始
    const startX = currentTransform?.x ?? 0
    const startY = currentTransform?.y ?? 0
    const startScale = currentTransform?.scale ?? 1

    // 计算最终的目标位置
    // 注意：deltaX/deltaY 是基于 from 的基准位置计算的
    // 如果元素有当前的偏移，需要将其加入计算
    const endX = deltaX
    const endY = deltaY

    // 关键帧：从当前状态到目标状态
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

  // 自动清理
  tryOnScopeDispose(cancel)

  return {
    isAnimating: readonly(isAnimating),
    flip,
    flipReverse,
    cancel,
  }
}
