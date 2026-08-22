import type { Point } from 'hana-img-viewer-core'

import { useEffect, useRef, useState } from 'react'

import { isClient } from '@/utils/helpers'

export interface DragState {
  offset: Point
  delta: Point
  position: Point
  isFirst: boolean
  isLast: boolean
  event: PointerEvent
}

export interface UseDragOptions {
  target: HTMLElement | null
  enabled?: boolean
  filter?: (event: PointerEvent) => boolean
  onDragStart?: (state: DragState) => void
  onDrag?: (state: DragState) => void
  onDragEnd?: (state: DragState) => void
  preventDefault?: boolean
  stopPropagation?: boolean
  pointerTypes?: ('mouse' | 'touch' | 'pen')[]
}

export interface UseDragReturn {
  isDragging: boolean
  offset: Point
  cancel: () => void
  stop: () => void
}

export const useDrag = (options: UseDragOptions): UseDragReturn => {
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

  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const callbacksRef = useRef({
    filter,
    onDragStart,
    onDrag,
    onDragEnd,
    preventDefault,
    stopPropagation,
    pointerTypes,
  })
  callbacksRef.current = {
    filter,
    onDragStart,
    onDrag,
    onDragEnd,
    preventDefault,
    stopPropagation,
    pointerTypes,
  }
  const draggingRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isClient)
      return

    const el = target
    if (!el)
      return

    let startPos: Point = { x: 0, y: 0 }
    let lastPos: Point = { x: 0, y: 0 }

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

    const handlePointerDown = (event: PointerEvent): void => {
      if (!enabledRef.current)
        return

      const callbacks = callbacksRef.current

      if (
        !callbacks.pointerTypes.includes(
          event.pointerType as 'mouse' | 'touch' | 'pen',
        )
      ) {
        return
      }

      if (activePointerIdRef.current !== null)
        return

      if (callbacks.filter && !callbacks.filter(event))
        return

      if (callbacks.preventDefault)
        event.preventDefault()
      if (callbacks.stopPropagation)
        event.stopPropagation()

      el.setPointerCapture(event.pointerId)
      activePointerIdRef.current = event.pointerId

      startPos = { x: event.clientX, y: event.clientY }
      lastPos = { ...startPos }
      setOffset({ x: 0, y: 0 })

      draggingRef.current = true
      setIsDragging(true)

      callbacks.onDragStart?.(createDragState(event, true, false))
    }

    const handlePointerMove = (event: PointerEvent): void => {
      if (event.pointerId !== activePointerIdRef.current)
        return

      if (!draggingRef.current)
        return

      const callbacks = callbacksRef.current

      if (callbacks.preventDefault)
        event.preventDefault()

      if (rafIdRef.current !== null)
        return

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null

        const state = createDragState(event, false, false)

        setOffset(state.offset)

        lastPos = state.position

        callbacks.onDrag?.(state)
      })
    }

    const handlePointerUp = (event: PointerEvent): void => {
      if (event.pointerId !== activePointerIdRef.current)
        return

      if (!draggingRef.current)
        return

      const callbacks = callbacksRef.current

      el.releasePointerCapture(event.pointerId)

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      callbacks.onDragEnd?.(createDragState(event, false, true))

      draggingRef.current = false
      setIsDragging(false)
      activePointerIdRef.current = null
    }

    const handlePointerCancel = (event: PointerEvent): void => {
      handlePointerUp(event)
    }

    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerup', handlePointerUp)
    el.addEventListener('pointercancel', handlePointerCancel)

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerup', handlePointerUp)
      el.removeEventListener('pointercancel', handlePointerCancel)

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      if (activePointerIdRef.current !== null) {
        try {
          el.releasePointerCapture(activePointerIdRef.current)
        }
        catch {}
        activePointerIdRef.current = null
      }

      if (draggingRef.current) {
        draggingRef.current = false
        setIsDragging(false)
      }
    }
  }, [target])

  const cancel = (): void => {
    if (!draggingRef.current)
      return

    const el = target
    if (el && activePointerIdRef.current !== null) {
      try {
        el.releasePointerCapture(activePointerIdRef.current)
      }
      catch {}
    }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    draggingRef.current = false
    setIsDragging(false)
    activePointerIdRef.current = null
  }

  const stop = (): void => {
    cancel()
  }

  return {
    isDragging,
    offset,
    cancel,
    stop,
  }
}
