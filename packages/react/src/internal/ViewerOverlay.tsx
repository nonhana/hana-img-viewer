import type { Point, Transform } from 'hana-img-viewer-core'
import type { RefObject } from 'react'

import type { ViewerPhase } from './viewerReducer'
import {
  clamp,
  createTrackpadDetector,
  getScrollbarWidth,
  getTouchMetrics,
  getTwoTouches,
  getZoomAnchoredPosition,
  loadImage,
  resolveAspectRatio,
} from 'hana-img-viewer-core'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

interface ViewerRect {
  width: number
  height: number
}

interface ViewerOverlayProps {
  phase: Exclude<ViewerPhase, 'closed'>
  container: HTMLElement
  originRef: RefObject<HTMLDivElement | null>
  src: string
  previewSrc?: string
  alt: string
  minZoom: number
  maxZoom: number
  closeOnBackdropClick: boolean
  closeOnEscape: boolean
  showCloseButton: boolean
  transitionDuration: number
  onRequestClose: () => void
  onOpenFinished: () => void
  onCloseFinished: () => void
}

interface BodyLockSnapshot {
  overflow: string
  paddingRight: string
}

const FLIP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const bodyLockOwners = new Set<object>()
let bodyLockSnapshot: BodyLockSnapshot | null = null
let appliedBodyOverflow: string | null = null
let appliedBodyPaddingRight: string | null = null

const acquireBodyLock = (owner: object) => {
  if (bodyLockOwners.has(owner))
    return

  if (bodyLockOwners.size === 0) {
    bodyLockSnapshot = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }

    const scrollbarWidth = getScrollbarWidth()
    const currentPadding
      = Number.parseInt(getComputedStyle(document.body).paddingRight, 10) || 0

    appliedBodyOverflow = 'hidden'
    appliedBodyPaddingRight
      = scrollbarWidth > 0
        ? `${currentPadding + scrollbarWidth}px`
        : bodyLockSnapshot.paddingRight

    document.body.style.overflow = appliedBodyOverflow
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = appliedBodyPaddingRight
  }

  bodyLockOwners.add(owner)
}

const releaseBodyLock = (owner: object) => {
  if (!bodyLockOwners.delete(owner) || bodyLockOwners.size > 0)
    return

  if (
    bodyLockSnapshot
    && document.body.style.overflow === appliedBodyOverflow
  ) {
    document.body.style.overflow = bodyLockSnapshot.overflow
  }

  if (
    bodyLockSnapshot
    && appliedBodyPaddingRight !== null
    && document.body.style.paddingRight === appliedBodyPaddingRight
  ) {
    document.body.style.paddingRight = bodyLockSnapshot.paddingRight
  }

  bodyLockSnapshot = null
  appliedBodyOverflow = null
  appliedBodyPaddingRight = null
}

const transformToCss = ({ x, y, scale }: Transform): string =>
  `translate3d(${x}px, ${y}px, 0) scale(${scale})`

export const ViewerOverlay = ({
  phase,
  container,
  originRef,
  src,
  previewSrc,
  alt,
  minZoom,
  maxZoom,
  closeOnBackdropClick,
  closeOnEscape,
  showCloseButton,
  transitionDuration,
  onRequestClose,
  onOpenFinished,
  onCloseFinished,
}: ViewerOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLImageElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const bodyLockOwnerRef = useRef<object>({})
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 })
  const animationGenerationRef = useRef(0)
  const sourceGenerationRef = useRef(0)
  const transitionRunRef = useRef<{
    phase: Exclude<ViewerPhase, 'closed'>
    startedAt: number
    openingTargetTransform?: string
  } | null>(null)
  const enhancementRequestRef = useRef<{
    baseSrc: string
    previewSrc: string
    promise: Promise<boolean>
  } | null>(null)
  const previousAnimationPhaseRef = useRef<ViewerPhase>('closed')
  const [destinationRect, setDestinationRect] = useState<ViewerRect | null>(null)
  const [sourceState, setSourceState] = useState(() => ({
    baseSrc: src,
    displaySrc: src,
    previewSrc,
  }))
  const [gesture, setGesture] = useState<'idle' | 'drag' | 'pinch'>('idle')
  const displaySrc
    = sourceState.baseSrc === src && sourceState.previewSrc === previewSrc
      ? sourceState.displaySrc
      : src

  useLayoutEffect(() => {
    const measure = () => {
      const origin = originRef.current
      const originImage = origin?.querySelector('img')
      const originRect = origin?.getBoundingClientRect() ?? null
      const overlay = overlayRef.current
      const overlayRect = overlay?.getBoundingClientRect()
      const aspectRatio = resolveAspectRatio(originImage, originRect)
      const viewportWidth
        = overlay?.clientWidth || overlayRect?.width || window.innerWidth
      const viewportHeight
        = overlay?.clientHeight || overlayRect?.height || window.innerHeight
      const maxWidth = viewportWidth * 0.9
      const maxHeight = viewportHeight * 0.9

      let width = maxWidth
      let height = width / aspectRatio

      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }

      // Geometry is only trustworthy after the portal has committed.
      // eslint-disable-next-line react/set-state-in-effect
      setDestinationRect(current =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      )
    }

    let resizeFrame: number | null = null
    const handleResize = () => {
      if (resizeFrame !== null)
        cancelAnimationFrame(resizeFrame)

      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null
        measure()
      })
    }

    measure()
    const thumbnailImage = originRef.current?.querySelector('img')
    const resizeObserver
      = typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(handleResize)
    thumbnailImage?.addEventListener('load', measure)
    if (overlayRef.current)
      resizeObserver?.observe(overlayRef.current)
    window.addEventListener('resize', handleResize)

    return () => {
      thumbnailImage?.removeEventListener('load', measure)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', handleResize)
      if (resizeFrame !== null)
        cancelAnimationFrame(resizeFrame)
    }
  }, [originRef, src])

  useLayoutEffect(() => {
    // A new source tuple must return to its base before the browser paints.
    // eslint-disable-next-line react/set-state-in-effect
    setSourceState(current =>
      current.baseSrc === src
      && current.previewSrc === previewSrc
      && current.displaySrc === src
        ? current
        : { baseSrc: src, displaySrc: src, previewSrc },
    )
  }, [previewSrc, src])

  useEffect(() => {
    const generation = ++sourceGenerationRef.current
    let active = true

    if (!previewSrc || previewSrc === src) {
      enhancementRequestRef.current = null
      return () => {
        active = false
      }
    }

    const currentRequest = enhancementRequestRef.current
    const request
      = currentRequest?.baseSrc === src
        && currentRequest.previewSrc === previewSrc
        ? currentRequest
        : {
            baseSrc: src,
            previewSrc,
            promise: loadImage(previewSrc),
          }
    enhancementRequestRef.current = request

    void request.promise.then((ready) => {
      if (
        active
        && ready
        && generation === sourceGenerationRef.current
      ) {
        setSourceState({ baseSrc: src, displaySrc: previewSrc, previewSrc })
      }
    })

    return () => {
      active = false
    }
  }, [previewSrc, src])

  useLayoutEffect(() => {
    if (container !== document.body)
      return

    const owner = bodyLockOwnerRef.current
    acquireBodyLock(owner)
    return () => releaseBodyLock(owner)
  }, [container])

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const backdrop = backdropRef.current
    const shell = shellRef.current
    const origin = originRef.current

    if (!overlay || !backdrop || !shell || !origin || !destinationRect)
      return

    const generation = ++animationGenerationRef.current
    const previousPhase = previousAnimationPhaseRef.current
    previousAnimationPhaseRef.current = phase
    const now = performance.now()
    const currentTransition = transitionRunRef.current
    const isContinuingTransition
      = currentTransition?.phase === phase && previousPhase === phase

    if (!isContinuingTransition) {
      transitionRunRef.current = {
        phase,
        startedAt: now,
        openingTargetTransform:
          phase === 'opening' && previousPhase === 'closing'
            ? transformToCss(transformRef.current)
            : undefined,
      }
    }

    const remainingDuration = Math.max(
      0,
      transitionDuration - (now - transitionRunRef.current!.startedAt),
    )
    const ownedAnimations: Animation[] = []
    let active = true

    const originRect = origin.getBoundingClientRect()
    const shellRect = shell.getBoundingClientRect()
    const deltaX
      = originRect.left + originRect.width / 2
        - (shellRect.left + shellRect.width / 2)
    const deltaY
      = originRect.top + originRect.height / 2
        - (shellRect.top + shellRect.height / 2)
    const originTransform = `translate(${deltaX}px, ${deltaY}px) scale(${originRect.width / shellRect.width}, ${originRect.height / shellRect.height})`

    const animate = (
      element: HTMLElement,
      keyframes: Keyframe[],
    ): Animation => {
      const animation = element.animate(keyframes, {
        duration: remainingDuration,
        easing: FLIP_EASING,
        fill: 'forwards',
      })
      ownedAnimations.push(animation)
      return animation
    }

    if (phase === 'opening') {
      overlay.focus({ preventScroll: true })

      const continuing
        = previousPhase === 'opening' || previousPhase === 'closing'
      const computedShellTransform = getComputedStyle(shell).transform
      const fromTransform
        = continuing
          && computedShellTransform
          && computedShellTransform !== 'none'
          ? computedShellTransform
          : originTransform
      const targetTransform
        = transitionRunRef.current?.openingTargetTransform
          ?? 'translate(0, 0) scale(1)'
      const computedOpacity = Number.parseFloat(getComputedStyle(backdrop).opacity)
      const fromOpacity
        = continuing && Number.isFinite(computedOpacity) ? computedOpacity : 0

      animate(shell, [
        { transform: fromTransform },
        { transform: targetTransform },
      ])
      animate(backdrop, [{ opacity: fromOpacity }, { opacity: 1 }])
      if (closeButtonRef.current)
        animate(closeButtonRef.current, [{ opacity: fromOpacity }, { opacity: 1 }])
    }
    else if (phase === 'closing') {
      const computedShellTransform = getComputedStyle(shell).transform
      const startTransform
        = (previousPhase === 'opening' || previousPhase === 'closing')
          && computedShellTransform
          && computedShellTransform !== 'none'
          ? computedShellTransform
          : transformToCss(transformRef.current)
      const computedOpacity = Number.parseFloat(getComputedStyle(backdrop).opacity)

      if (previewRef.current)
        previewRef.current.style.transform = transformToCss({ x: 0, y: 0, scale: 1 })

      animate(shell, [
        { transform: startTransform },
        { transform: originTransform },
      ])
      animate(backdrop, [
        { opacity: Number.isFinite(computedOpacity) ? computedOpacity : 1 },
        { opacity: 0 },
      ])
      if (closeButtonRef.current) {
        animate(closeButtonRef.current, [
          { opacity: Number.isFinite(computedOpacity) ? computedOpacity : 1 },
          { opacity: 0 },
        ])
      }
    }
    else {
      previousAnimationPhaseRef.current = phase
      return
    }

    void Promise.all(
      ownedAnimations.map(animation =>
        animation.finished.catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError'))
            throw error
        }),
      ),
    ).then(() => {
      if (!active || generation !== animationGenerationRef.current)
        return

      for (const animation of ownedAnimations) {
        animation.commitStyles()
        animation.cancel()
      }

      if (phase === 'opening') {
        shell.style.transform = ''
        if (previewRef.current)
          previewRef.current.style.transform = transformToCss(transformRef.current)
        onOpenFinished()
      }
      else {
        onCloseFinished()
      }
    })

    return () => {
      active = false
      for (const animation of ownedAnimations) {
        try {
          animation.commitStyles()
        }
        catch {}
        animation.cancel()
      }
    }
  }, [
    destinationRect,
    onCloseFinished,
    onOpenFinished,
    originRef,
    phase,
    transitionDuration,
  ])

  useEffect(() => {
    if (phase !== 'open')
      return

    const preview = previewRef.current
    if (!preview)
      return

    const detector = createTrackpadDetector()
    let owner: 'idle' | 'drag' | 'pinch' = 'idle'
    let activePointerId: number | null = null
    let lastPointer: Point = { x: 0, y: 0 }
    let pinchDistance = 0
    let transformFrame: number | null = null

    const currentTransform = transformRef.current
    if (currentTransform.scale !== 1) {
      const scale = clamp(currentTransform.scale, minZoom, maxZoom)
      transformRef.current = {
        ...currentTransform,
        scale,
      }
    }

    preview.style.transform = transformToCss(transformRef.current)
    preview.style.cursor = 'grab'

    const applyTransform = () => {
      if (transformFrame !== null)
        return

      transformFrame = requestAnimationFrame(() => {
        transformFrame = null
        preview.style.transform = transformToCss(transformRef.current)
        if (owner === 'idle')
          preview.style.cursor = 'grab'
      })
    }

    const setScale = (
      nextScale: number,
      anchor: Point,
      allowBaseline = false,
    ) => {
      const current = transformRef.current
      if (allowBaseline && nextScale === 1) {
        transformRef.current = { x: 0, y: 0, scale: 1 }
        applyTransform()
        return
      }

      const scale
        = clamp(nextScale, minZoom, maxZoom)
      if (scale === current.scale)
        return

      const shellRect = shellRef.current?.getBoundingClientRect()
      const viewportCenter = shellRect
        ? {
            x: shellRect.left + shellRect.width / 2,
            y: shellRect.top + shellRect.height / 2,
          }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const position = getZoomAnchoredPosition(
        current,
        anchor,
        current.scale,
        scale,
        viewportCenter,
      )

      transformRef.current = { ...position, scale }
      applyTransform()
    }

    const finishDrag = () => {
      if (activePointerId !== null) {
        try {
          preview.releasePointerCapture(activePointerId)
        }
        catch {}
      }
      activePointerId = null
      if (owner === 'drag') {
        owner = 'idle'
        setGesture('idle')
      }
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const sensitivity = detector.detect(event) ? 0.01 : 0.002
      setScale(transformRef.current.scale - event.deltaY * sensitivity, {
        x: event.clientX,
        y: event.clientY,
      })
    }

    const handleDoubleClick = (event: MouseEvent) => {
      event.preventDefault()
      const currentScale = transformRef.current.scale
      const isBaseline = currentScale === 1
      const targetScale
        = isBaseline ? clamp(2, minZoom, maxZoom) : 1
      setScale(
        targetScale,
        { x: event.clientX, y: event.clientY },
        !isBaseline,
      )
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (owner !== 'idle')
        return

      event.preventDefault()
      preview.setPointerCapture(event.pointerId)
      activePointerId = event.pointerId
      lastPointer = { x: event.clientX, y: event.clientY }
      owner = 'drag'
      setGesture('drag')
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (owner !== 'drag' || event.pointerId !== activePointerId)
        return

      event.preventDefault()
      const current = transformRef.current
      transformRef.current = {
        ...current,
        x: current.x + event.clientX - lastPointer.x,
        y: current.y + event.clientY - lastPointer.y,
      }
      lastPointer = { x: event.clientX, y: event.clientY }
      applyTransform()
    }

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId === activePointerId)
        finishDrag()
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touches = getTwoTouches(event.touches)
      if (!touches)
        return

      event.preventDefault()
      finishDrag()
      const metrics = getTouchMetrics(...touches)
      pinchDistance = metrics.distance
      owner = 'pinch'
      setGesture('pinch')
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (owner !== 'pinch')
        return

      const touches = getTwoTouches(event.touches)
      if (!touches || pinchDistance <= 0)
        return

      event.preventDefault()
      const metrics = getTouchMetrics(...touches)
      setScale(
        transformRef.current.scale * (metrics.distance / pinchDistance),
        metrics.center,
      )
      pinchDistance = metrics.distance
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (owner !== 'pinch' || event.touches.length >= 2)
        return

      owner = 'idle'
      pinchDistance = 0
      setGesture('idle')
    }

    preview.addEventListener('wheel', handleWheel, { passive: false })
    preview.addEventListener('dblclick', handleDoubleClick)
    preview.addEventListener('pointerdown', handlePointerDown)
    preview.addEventListener('pointermove', handlePointerMove)
    preview.addEventListener('pointerup', handlePointerEnd)
    preview.addEventListener('pointercancel', handlePointerEnd)
    preview.addEventListener('touchstart', handleTouchStart, { passive: false })
    preview.addEventListener('touchmove', handleTouchMove, { passive: false })
    preview.addEventListener('touchend', handleTouchEnd)
    preview.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      preview.removeEventListener('wheel', handleWheel)
      preview.removeEventListener('dblclick', handleDoubleClick)
      preview.removeEventListener('pointerdown', handlePointerDown)
      preview.removeEventListener('pointermove', handlePointerMove)
      preview.removeEventListener('pointerup', handlePointerEnd)
      preview.removeEventListener('pointercancel', handlePointerEnd)
      preview.removeEventListener('touchstart', handleTouchStart)
      preview.removeEventListener('touchmove', handleTouchMove)
      preview.removeEventListener('touchend', handleTouchEnd)
      preview.removeEventListener('touchcancel', handleTouchEnd)
      finishDrag()
      owner = 'idle'
      pinchDistance = 0
      setGesture('idle')
      detector.reset()
      if (transformFrame !== null)
        cancelAnimationFrame(transformFrame)
    }
  }, [maxZoom, minZoom, phase])

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    if (!overlay)
      return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !closeOnEscape)
        return

      event.preventDefault()
      event.stopPropagation()
      onRequestClose()
    }

    overlay.addEventListener('keydown', handleKeyDown)
    return () => overlay.removeEventListener('keydown', handleKeyDown)
  }, [closeOnEscape, onRequestClose])

  useLayoutEffect(() => {
    const backdrop = backdropRef.current
    if (!backdrop)
      return

    const handleClick = (event: MouseEvent) => {
      if (!closeOnBackdropClick)
        return

      event.stopPropagation()
      onRequestClose()
    }

    backdrop.addEventListener('click', handleClick)
    return () => backdrop.removeEventListener('click', handleClick)
  }, [closeOnBackdropClick, onRequestClose])

  return createPortal(
    <div
      ref={overlayRef}
      className="hana-img-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
      tabIndex={-1}
    >
      <div
        ref={backdropRef}
        className="hana-img-viewer-backdrop"
        aria-hidden="true"
      />
      {showCloseButton && (
        <button
          ref={closeButtonRef}
          type="button"
          className="hana-img-viewer-close-button"
          aria-label="Close"
          onClick={onRequestClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
      <div
        ref={shellRef}
        className="hana-img-viewer-flip-shell"
        style={destinationRect
          ? {
              width: `${destinationRect.width}px`,
              height: `${destinationRect.height}px`,
            }
          : undefined}
      >
        <img
          ref={previewRef}
          className="hana-img-viewer-preview"
          src={displaySrc}
          alt={alt}
          draggable={false}
          style={{
            cursor: phase !== 'open'
              ? 'default'
              : gesture === 'idle'
                ? 'grab'
                : 'grabbing',
          }}
        />
      </div>
    </div>,
    container,
  )
}
