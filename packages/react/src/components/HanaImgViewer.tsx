import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'

import type {
  HanaImgViewerProps,
  Transform,
  ViewerInteractionPhase,
} from '@/types'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'

import { createPortal, flushSync } from 'react-dom'

import {
  DEFAULT_FLIP_DURATION,
  DEFAULT_FLIP_EASING,
  useFlip,
} from '@/hooks/core'
import { useElementRef } from '@/hooks/useElementRef'
import {
  useBodyLock,
  usePortalTarget,
  useViewerGeometry,
  useViewerInteractions,
  useViewerPhase,
  useViewerSource,
  useViewerTransform,
} from '@/hooks/viewer'
import { defaultProps } from '@/types'

type ResolvedPhase = 'closed' | 'pending' | 'opening' | 'open' | 'closing'

export const HanaImgViewer = (props: HanaImgViewerProps) => {
  const {
    src,
    alt = defaultProps.alt,
    previewSrc,
    open,
    portalTarget,
    enableZoom = defaultProps.enableZoom,
    enableDrag = defaultProps.enableDrag,
    enableKeyboard = defaultProps.enableKeyboard,
    containerClass,
    containerStyle,
    thumbnailClass,
    thumbnailStyle: thumbnailStyleProp,
    thumbnail,
    ref,
  } = props

  const propsRef = useRef(props)
  propsRef.current = props

  // Controlled-mode is a static contract decided at mount time, not toggled at
  // runtime. Presence of `open` or `onOpenChange` marks the component as
  // controlled, mirroring Vue's vnode.props check (a transiently-undefined
  // `v-model:open` binding still counts).
  const [{ isControlled, initialPhase }] = useState<{
    isControlled: boolean
    initialPhase: ViewerInteractionPhase
  }>(() => {
    const controlled = 'open' in props || 'onOpenChange' in props
    return {
      isControlled: controlled,
      initialPhase: controlled && props.open === true ? 'opening' : 'closed',
    }
  })

  const viewerPhase = useViewerPhase({
    open,
    isControlled,
    initialPhase,
    onOpenChange: value => propsRef.current.onOpenChange?.(value),
  })
  const { phase, requestOpen, requestClose, markOpened, markClosed }
    = viewerPhase

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  // Read the live phase after async animation flows. A plain `phaseRef.current`
  // comparison trips TS control-flow narrowing across `await`, so guard
  // through this helper instead.
  const isClosed = (): boolean => phaseRef.current === 'closed'

  const openPreview = (): void => {
    if (!isClosed())
      return
    requestOpen()
  }

  const closePreview = (): void => {
    if (isClosed() || phaseRef.current === 'closing')
      return
    requestClose()
  }

  const thumbnailContainer = useElementRef<HTMLDivElement>()
  const thumbnailImg = useElementRef<HTMLImageElement>()
  const backdrop = useElementRef<HTMLDivElement>()
  const flip = useElementRef<HTMLDivElement>()
  const preview = useElementRef<HTMLImageElement>()

  const transitionRunIdRef = useRef(0)
  const [closingTransform, setClosingTransform] = useState<Transform | null>(
    null,
  )
  const enhancementEmittedRef = useRef(false)
  const sourceErrorEmittedRef = useRef(false)

  const portal = usePortalTarget(portalTarget)
  const { isMounted, resolvedTarget, canMountOverlay, isBodyTarget } = portal

  const { lock: lockBody, unlock: unlockBody } = useBodyLock()

  const source = useViewerSource({
    src: () => propsRef.current.src,
    previewSrc: () => propsRef.current.previewSrc,
  })

  const geometry = useViewerGeometry({
    thumbnailTarget: () =>
      thumbnailImg.ref.current ?? thumbnailContainer.ref.current,
    thumbnailImage: () => thumbnailImg.ref.current,
  })

  const transformApi = useViewerTransform({
    minScale: () => propsRef.current.minZoom ?? defaultProps.minZoom,
    maxScale: () => propsRef.current.maxZoom ?? defaultProps.maxZoom,
  })

  const interactions = useViewerInteractions({
    target: preview.el,
    zoomTarget: flip.el,
    enabled: phase === 'open',
    enableDrag,
    enableZoom,
    enableKeyboard: enableKeyboard && isBodyTarget,
    onPan: delta => transformApi.pan(delta),
    onWheelZoom: (delta, anchor) => transformApi.addScale(delta, anchor),
    onPinchZoom: (factor, anchor) => transformApi.multiplyScale(factor, anchor),
    onDoubleClick: anchor => transformApi.toggleDoubleClickZoom(anchor),
    onEscape: () => {
      void closePreview()
    },
    getViewportCenter: geometry.getViewportCenter,
  })

  const {
    flip: flipForward,
    flipReverse,
    cancel: cancelAnimation,
  } = useFlip({
    duration: DEFAULT_FLIP_DURATION,
    easing: DEFAULT_FLIP_EASING,
  })

  const backdropAnimationRef = useRef<Animation | null>(null)

  const isOverlayMounted = phase !== 'closed'
  const isInteractive = phase === 'open'
  const isInteracting
    = interactions.isDragging
      || interactions.isPinching
      || interactions.isWheeling
  const previewCursor: CSSProperties['cursor']
    = !isInteractive || !enableDrag
      ? 'default'
      : isInteracting
        ? 'grabbing'
        : 'grab'

  const thumbnailContainerStyle: CSSProperties = {
    display: 'inline-block',
    visibility: isOverlayMounted ? 'hidden' : 'visible',
    ...containerStyle,
  }

  const thumbnailImgStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer',
    ...thumbnailStyleProp,
  }

  const overlayStyle: CSSProperties = {
    pointerEvents: isOverlayMounted ? 'auto' : 'none',
  }

  const backdropStyle: CSSProperties = {
    opacity: phase === 'opening' ? 0 : 1,
  }

  const flipShellStyle: CSSProperties = {
    width: geometry.destinationRect
      ? `${geometry.destinationRect.width}px`
      : undefined,
    height: geometry.destinationRect
      ? `${geometry.destinationRect.height}px`
      : undefined,
    transform: closingTransform
      ? `translate3d(${closingTransform.x}px, ${closingTransform.y}px, 0) scale(${closingTransform.scale})`
      : 'none',
    transformOrigin: 'center center',
  }

  const previewStyle: CSSProperties = {
    transform: closingTransform ? 'none' : transformApi.transformCss,
    transformOrigin: 'center center',
    willChange: isInteractive ? 'transform' : 'auto',
    cursor: previewCursor,
  }

  const animateBackdropOpacity = async (targetOpacity: number): Promise<void> => {
    const backdropEl = backdrop.ref.current

    if (!backdropEl)
      return

    const currentOpacity = Number.parseFloat(
      window.getComputedStyle(backdropEl).opacity,
    )
    const fromOpacity = Number.isFinite(currentOpacity)
      ? currentOpacity
      : targetOpacity === 0
        ? 1
        : 0

    if (Math.abs(fromOpacity - targetOpacity) < 0.001)
      return

    if (backdropAnimationRef.current) {
      backdropAnimationRef.current.cancel()
      backdropAnimationRef.current = null
    }

    try {
      backdropAnimationRef.current = backdropEl.animate(
        [{ opacity: fromOpacity }, { opacity: targetOpacity }],
        {
          duration: DEFAULT_FLIP_DURATION,
          easing: DEFAULT_FLIP_EASING,
          fill: 'forwards',
        },
      )

      await backdropAnimationRef.current.finished

      if (backdropAnimationRef.current) {
        backdropAnimationRef.current.commitStyles()
        backdropAnimationRef.current.cancel()
      }
    }
    catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        throw error
      }
    }
    finally {
      backdropAnimationRef.current = null
    }
  }

  const emitSourceEvents = (): void => {
    if (source.sourcePhase === 'enhanced' && !enhancementEmittedRef.current) {
      enhancementEmittedRef.current = true
      propsRef.current.onLoad?.(new Event('load'))
    }

    if (source.sourcePhase === 'enhance-error' && !sourceErrorEmittedRef.current) {
      sourceErrorEmittedRef.current = true
      propsRef.current.onError?.(new Event('error'))
    }
  }

  const resetOverlaySessionState = (): void => {
    cancelAnimation()
    if (backdropAnimationRef.current) {
      backdropAnimationRef.current.cancel()
      backdropAnimationRef.current = null
    }
    setClosingTransform(null)
    enhancementEmittedRef.current = false
    sourceErrorEmittedRef.current = false
    transformApi.reset()
    source.reset()
    geometry.resetDestinationRect()
  }

  const finalizeClosedState = (): void => {
    markClosed()
    resetOverlaySessionState()
    unlockBody()
    propsRef.current.onClose?.()
  }

  const runEnhancement = async (sessionToken?: number): Promise<void> => {
    await source.startEnhancement(sessionToken)
    emitSourceEvents()
  }

  const enterOpenFlow = async (skipFlip: boolean): Promise<void> => {
    if (!canMountOverlay)
      return

    source.beginSession()
    transitionRunIdRef.current += 1
    const runId = transitionRunIdRef.current

    setClosingTransform(null)
    enhancementEmittedRef.current = false
    sourceErrorEmittedRef.current = false
    transformApi.reset()

    // Commit the destination rect synchronously so the flip shell has its
    // final dimensions before the FLIP reads its bounding rect.
    flushSync(() => {
      geometry.prepareDestinationRect()
    })

    if (isBodyTarget)
      lockBody()

    if (runId !== transitionRunIdRef.current || isClosed())
      return

    const motionTasks: Promise<void>[] = [animateBackdropOpacity(1)]

    if (!skipFlip) {
      const thumbnailEl = geometry.captureThumbnailRect()
      const flipEl = flip.ref.current

      if (thumbnailEl && flipEl) {
        const to = flipEl.getBoundingClientRect()
        motionTasks.push(flipForward(thumbnailEl, to, flipEl))
      }
    }

    await Promise.all(motionTasks)

    if (runId !== transitionRunIdRef.current || isClosed())
      return

    markOpened()
    propsRef.current.onOpen?.()

    void runEnhancement()
  }

  const closePreviewInternal = async (): Promise<void> => {
    if (phaseRef.current === 'closed')
      return

    transitionRunIdRef.current += 1
    const runId = transitionRunIdRef.current
    source.endSession()

    const flipEl = flip.ref.current
    const thumbnailRect = geometry.captureThumbnailRect()
    const rect = geometry.destinationRect

    const closing: Transform = {
      x: transformApi.transform.x,
      y: transformApi.transform.y,
      scale: transformApi.transform.scale,
    }

    flushSync(() => {
      setClosingTransform(closing)
      transformApi.reset()
    })

    if (runId !== transitionRunIdRef.current) {
      return
    }

    const motionTasks: Promise<void>[] = [animateBackdropOpacity(0)]

    if (flipEl && thumbnailRect && rect) {
      motionTasks.push(
        flipReverse(
          new DOMRect(rect.left, rect.top, rect.width, rect.height),
          thumbnailRect,
          flipEl,
          closing,
        ),
      )
    }

    await Promise.all(motionTasks)

    if (runId !== transitionRunIdRef.current) {
      return
    }

    finalizeClosedState()
  }

  const reset = (): void => {
    transformApi.reset()
  }

  const handleBackdropClick = (): void => {
    if (propsRef.current.closeOnMaskClick === false)
      return
    void closePreview()
  }

  const handleThumbnailKeyDown = (event: ReactKeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPreview()
    }
  }

  // The effects below deliberately mirror Vue's `watch` semantics: each
  // dependency array is the single logical trigger, and every referenced
  // function reads live refs (phaseRef/propsRef/...) instead of closure
  // state. The exhaustive-deps rule is disabled for this region because
  // these deps ARE the contract; line-scoped disables are not honored here.
  /* eslint-disable react/exhaustive-deps */

  // Emit enhancement load/error events when the source phase changes.
  useEffect(() => {
    emitSourceEvents()
  }, [source.sourcePhase])

  // Vue's `watch(() => props.src)` is not immediate: only react to a change.
  const prevSrcRef = useRef(src)
  useEffect(() => {
    const prev = prevSrcRef.current
    prevSrcRef.current = src
    if (prev === src)
      return

    if (phaseRef.current === 'closed') {
      source.reset()
      return
    }
    enhancementEmittedRef.current = false
    sourceErrorEmittedRef.current = false
    source.beginSession()
    if (phaseRef.current === 'open')
      void runEnhancement()
  }, [src])

  const prevPreviewSrcRef = useRef(previewSrc)
  useEffect(() => {
    const prev = prevPreviewSrcRef.current
    prevPreviewSrcRef.current = previewSrc
    if (prev === previewSrc)
      return

    if (phaseRef.current === 'open') {
      source.beginSession({ resetToBase: false })
      void runEnhancement()
    }
  }, [previewSrc])

  const prevBodyTargetRef = useRef(isBodyTarget)
  useEffect(() => {
    const prev = prevBodyTargetRef.current
    prevBodyTargetRef.current = isBodyTarget
    if (!isOverlayMounted || prev === isBodyTarget)
      return
    if (isBodyTarget) {
      lockBody()
    }
    else {
      unlockBody()
    }
  }, [isBodyTarget, isOverlayMounted])

  // Debounced geometry recompute while open.
  useEffect(() => {
    if (phase !== 'open')
      return

    let timer: number | undefined
    const handleResize = (): void => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        geometry.prepareDestinationRect()
      }, 50)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [phase])

  // Props → phase bridge that drives the animation flows. `pending` names the
  // state where phase='opening' but the overlay can't mount yet, and resuming
  // from it treats the opening as a hydration-style transition (skipFlip).
  const desiredPhase: ResolvedPhase
    = phase === 'opening' && (!isMounted || !canMountOverlay) ? 'pending' : phase

  const prevDesiredPhaseRef = useRef<ResolvedPhase | null>(null)
  useEffect(() => {
    const next = desiredPhase
    const prev = prevDesiredPhaseRef.current
    prevDesiredPhaseRef.current = next

    if (prev === next)
      return

    if (next === 'opening') {
      void enterOpenFlow(prev === 'pending')
    }
    else if (next === 'closing') {
      void closePreviewInternal()
    }
  }, [desiredPhase])

  useImperativeHandle(
    ref,
    () => ({
      open: openPreview,
      close: closePreview,
      reset,
    }),
    [],
  )

  /* eslint-enable react/exhaustive-deps */

  return (
    <>
      <div
        ref={thumbnailContainer.attach}
        className={containerClass}
        style={thumbnailContainerStyle}
      >
        {thumbnail
          ? (
              thumbnail({ open: openPreview })
            )
          : (
              <img
                ref={thumbnailImg.attach}
                src={src}
                alt={alt}
                className={thumbnailClass}
                style={thumbnailImgStyle}
                // 缩略图以 <img> 承载 button 语义（CSS 选择器依赖 <img> 标签）；
                // 键盘交互已由 handleThumbnailKeyDown 提供（Enter/Space 打开）
                /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role */
                role="button"
                tabIndex={0}
                onClick={openPreview}
                onKeyDown={handleThumbnailKeyDown}
              />
            )}
      </div>

      {isMounted
        && resolvedTarget
        && isOverlayMounted
        && createPortal(
          <div
            className="hana-img-viewer-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={alt || 'Image preview'}
            style={overlayStyle}
          >
            <div
              ref={backdrop.attach}
              className="hana-img-viewer-backdrop"
              aria-hidden="true"
              style={backdropStyle}
              onClick={handleBackdropClick}
            />
            <div
              ref={flip.attach}
              className="hana-img-viewer-flip-shell"
              style={flipShellStyle}
            >
              <img
                ref={preview.attach}
                src={source.displaySrc}
                alt={alt}
                className="hana-img-viewer-preview"
                style={previewStyle}
                draggable={false}
              />
            </div>
          </div>,
          resolvedTarget,
        )}
    </>
  )
}

HanaImgViewer.displayName = 'HanaImgViewer'

export default HanaImgViewer
