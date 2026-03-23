import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Point } from '@/types/utils'
import { readonly, ref, toValue } from 'vue'
import { useEventListener } from '@/composables/utils/useEventListener'
import { isClient, tryOnScopeDispose } from '@/utils/helpers'

/**
 * 拖拽状态
 */
export interface DragState {
  /** 相对于起始点的总偏移 */
  offset: Point
  /** 相对于上一帧的偏移 */
  delta: Point
  /** 当前位置 */
  position: Point
  /** 是否是第一帧 */
  isFirst: boolean
  /** 是否是最后一帧 */
  isLast: boolean
  /** 原始事件 */
  event: PointerEvent
}

/**
 * useDrag 选项
 */
export interface UseDragOptions {
  /**
   * 拖拽目标元素
   */
  target: MaybeRefOrGetter<HTMLElement | null | undefined>
  /**
   * 是否启用拖拽
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * 拖拽过滤器，在拖拽开始前调用
   *
   * 返回 `false` 可阻止本次拖拽（不会触发 onDragStart，isDragging 不会变为 true）。
   * 这对于实现双击检测等需要"拦截"拖拽开始的场景非常有用。
   *
   * @param event - 原始 PointerEvent
   * @returns 是否允许开始拖拽
   */
  filter?: (event: PointerEvent) => boolean
  /**
   * 拖拽开始回调
   */
  onDragStart?: (state: DragState) => void
  /**
   * 拖拽中回调
   */
  onDrag?: (state: DragState) => void
  /**
   * 拖拽结束回调
   */
  onDragEnd?: (state: DragState) => void
  /**
   * 是否阻止默认行为
   * @default true
   */
  preventDefault?: boolean
  /**
   * 是否阻止事件冒泡
   * @default false
   */
  stopPropagation?: boolean
  /**
   * 指针类型过滤（mouse, touch, pen）
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: ('mouse' | 'touch' | 'pen')[]
}

/**
 * useDrag 返回值
 */
export interface UseDragReturn {
  /** 是否正在拖拽 */
  isDragging: Readonly<Ref<boolean>>
  /** 当前偏移量 */
  offset: Readonly<Ref<Point>>
  /** 取消当前正在进行的拖拽（不会触发 onDragEnd） */
  cancel: () => void
  /** 停止拖拽监听 */
  stop: () => void
}

/**
 * 拖拽逻辑 composable
 *
 * 特性：
 * - 使用 PointerEvents 统一处理鼠标和触摸
 * - 使用 setPointerCapture 确保拖拽连续性
 * - 使用 RAF 调度更新以优化性能
 * - 提供完整的拖拽状态信息
 * - 支持启用/禁用控制
 *
 * @param options - 配置选项
 * @returns 拖拽状态和控制方法
 *
 * @example
 * ```ts
 * const el = ref<HTMLElement | null>(null)
 *
 * const { isDragging, offset, stop } = useDrag({
 *   target: el,
 *   onDragStart: (state) => console.log('开始拖拽'),
 *   onDrag: (state) => {
 *     // state.delta 是本帧偏移
 *     transform.pan(state.delta)
 *   },
 *   onDragEnd: (state) => console.log('结束拖拽'),
 * })
 * ```
 */
export function useDrag(options: UseDragOptions): UseDragReturn {
  const {
    target,
    enabled = true,
    filter,
    onDragStart,
    onDrag,
    onDragEnd,
    preventDefault = true,
    stopPropagation = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
  } = options

  // 状态
  const isDragging = ref(false)
  const offset = ref<Point>({ x: 0, y: 0 })

  // 内部状态
  let startPos: Point = { x: 0, y: 0 }
  let lastPos: Point = { x: 0, y: 0 }
  let activePointerId: number | null = null
  let rafId: number | null = null

  // 清理函数集合
  const cleanupFns: (() => void)[] = []

  /**
   * 检查指针类型是否允许
   */
  const isAllowedPointerType = (type: string): boolean => {
    return pointerTypes.includes(type as 'mouse' | 'touch' | 'pen')
  }

  /**
   * 创建拖拽状态对象
   */
  const createDragState = (
    event: PointerEvent,
    isFirst: boolean,
    isLast: boolean,
  ): DragState => {
    const position = { x: event.clientX, y: event.clientY }
    const currentOffset = {
      x: position.x - startPos.x,
      y: position.y - startPos.y,
    }
    const delta = {
      x: position.x - lastPos.x,
      y: position.y - lastPos.y,
    }

    return {
      offset: currentOffset,
      delta,
      position,
      isFirst,
      isLast,
      event,
    }
  }

  /**
   * 处理指针按下
   */
  const handlePointerDown = (event: PointerEvent): void => {
    // 检查是否启用
    if (!toValue(enabled))
      return

    // 检查指针类型
    if (!isAllowedPointerType(event.pointerType))
      return

    // 如果已经有活动的指针，忽略新的
    if (activePointerId !== null)
      return

    // 过滤器检查：返回 false 可阻止拖拽开始
    if (filter && !filter(event))
      return

    // 阻止默认行为和冒泡
    if (preventDefault)
      event.preventDefault()
    if (stopPropagation)
      event.stopPropagation()

    const el = toValue(target)
    if (!el)
      return

    // 捕获指针
    el.setPointerCapture(event.pointerId)
    activePointerId = event.pointerId

    // 记录起始位置
    startPos = { x: event.clientX, y: event.clientY }
    lastPos = { ...startPos }
    offset.value = { x: 0, y: 0 }

    // 设置拖拽状态
    isDragging.value = true

    // 触发开始回调
    const state = createDragState(event, true, false)
    onDragStart?.(state)
  }

  /**
   * 处理指针移动
   */
  const handlePointerMove = (event: PointerEvent): void => {
    // 检查是否是当前活动的指针
    if (event.pointerId !== activePointerId)
      return

    if (!isDragging.value)
      return

    // 阻止默认行为
    if (preventDefault)
      event.preventDefault()

    // 使用 RAF 调度更新
    if (rafId !== null)
      return

    rafId = requestAnimationFrame(() => {
      rafId = null

      const state = createDragState(event, false, false)

      // 更新偏移量
      offset.value = state.offset

      // 更新上一帧位置
      lastPos = state.position

      // 触发拖拽回调
      onDrag?.(state)
    })
  }

  /**
   * 处理指针释放
   */
  const handlePointerUp = (event: PointerEvent): void => {
    // 检查是否是当前活动的指针
    if (event.pointerId !== activePointerId)
      return

    if (!isDragging.value)
      return

    const el = toValue(target)
    if (el) {
      el.releasePointerCapture(event.pointerId)
    }

    // 取消待执行的 RAF
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    // 触发结束回调
    const state = createDragState(event, false, true)
    onDragEnd?.(state)

    // 重置状态
    isDragging.value = false
    activePointerId = null
  }

  /**
   * 处理指针取消（如触摸被系统中断）
   */
  const handlePointerCancel = (event: PointerEvent): void => {
    handlePointerUp(event)
  }

  /**
   * 设置事件监听
   *
   * 注意：不需要检查 target 是否存在，因为 useEventListener
   * 内部使用 watch 来响应式地监听目标变化，会在目标可用时自动绑定事件。
   */
  const setup = (): void => {
    if (!isClient)
      return

    // 监听目标元素的 pointerdown
    // useEventListener 会在 target 变为非空时自动绑定事件
    const { stop: stopPointerDown } = useEventListener(
      target,
      'pointerdown',
      handlePointerDown,
    )
    cleanupFns.push(stopPointerDown)

    // 监听 window 的 pointermove 和 pointerup（因为使用了 setPointerCapture）
    const { stop: stopPointerMove } = useEventListener(
      () => window,
      'pointermove',
      handlePointerMove,
    )
    cleanupFns.push(stopPointerMove)

    const { stop: stopPointerUp } = useEventListener(
      () => window,
      'pointerup',
      handlePointerUp,
    )
    cleanupFns.push(stopPointerUp)

    const { stop: stopPointerCancel } = useEventListener(
      () => window,
      'pointercancel',
      handlePointerCancel,
    )
    cleanupFns.push(stopPointerCancel)
  }

  /**
   * 清理
   */
  const cleanup = (): void => {
    for (const fn of cleanupFns) {
      fn()
    }
    cleanupFns.length = 0

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  /**
   * 取消当前正在进行的拖拽
   *
   * 与正常结束拖拽不同，cancel 不会触发 onDragEnd 回调。
   * 用于手势冲突场景，如双指缩放开始时需要立即取消拖拽。
   */
  const cancel = (): void => {
    if (!isDragging.value)
      return

    // 释放指针捕获
    const el = toValue(target)
    if (el && activePointerId !== null) {
      try {
        el.releasePointerCapture(activePointerId)
      }
      catch {
        // 可能已经被释放
      }
    }

    // 取消待执行的 RAF
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    // 重置状态
    isDragging.value = false
    activePointerId = null
  }

  /**
   * 停止拖拽监听
   */
  const stop = (): void => {
    cancel()
    cleanup()
  }

  // 初始化
  setup()

  // 自动清理
  tryOnScopeDispose(stop)

  return {
    isDragging: readonly(isDragging),
    offset: readonly(offset),
    cancel,
    stop,
  }
}
