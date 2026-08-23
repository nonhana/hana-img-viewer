<script setup lang="ts">
import type { Point, Transform } from 'hana-img-viewer-core'
import type { ViewerPhase } from './viewerState'
import {
  clamp,
  createTrackpadDetector,
  getTouchMetrics,
  getTwoTouches,
  getZoomAnchoredPosition,
  loadImage,
  resolveAspectRatio,
} from 'hana-img-viewer-core'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { acquireBodyLock, releaseBodyLock } from './bodyLock'

const props = defineProps<{
  phase: Exclude<ViewerPhase, 'closed'>
  container: HTMLElement
  originElement: HTMLElement | null
  src: string
  previewSrc?: string
  alt: string
  zoomEnabled: boolean
  minZoom: number
  maxZoom: number
  closeOnBackdropClick: boolean
  closeOnEscape: boolean
}>()

const emit = defineEmits<{
  (event: 'requestClose'): void
  (event: 'openFinished'): void
  (event: 'closeFinished'): void
}>()

const DOUBLE_CLICK_ZOOM = 2
const FLIP_DURATION = 300
const FLIP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const overlayRef = useTemplateRef('overlayRef')
const backdropRef = useTemplateRef('backdropRef')
const shellRef = useTemplateRef('shellRef')
const previewRef = useTemplateRef('previewRef')

const destinationRect = ref<{ width: number, height: number } | null>(null)
const displaySrc = ref(props.src)
const gesture = ref<'idle' | 'drag' | 'pinch'>('idle')
const transform: Transform = { x: 0, y: 0, scale: 1 } // shared ordinary object, not ref
const owner = {}

let sourceGeneration = 0
let sourceRequest: { src: string, previewSrc: string, promise: Promise<boolean> } | null = null
let resizeFrame: number | null = null
let transformFrame: number | null = null
let animationGeneration = 0
let previousPhase: ViewerPhase = 'closed'
let ownedAnimations: Animation[] = []
let cleanupGestures = () => {}
let resizeObserver: ResizeObserver | null = null

const transformToCss = ({ x, y, scale }: Transform) =>
  `translate3d(${x}px, ${y}px, 0) scale(${scale})`

const writeTransform = () => {
  if (transformFrame !== null)
    return

  transformFrame = requestAnimationFrame(() => {
    transformFrame = null
    if (previewRef.value)
      previewRef.value.style.transform = transformToCss(transform)
  })
}

const resetTransform = () => {
  transform.x = 0
  transform.y = 0
  transform.scale = 1
  if (previewRef.value)
    previewRef.value.style.transform = transformToCss(transform)
}

const measure = () => {
  const origin = props.originElement
  const originImage = origin?.querySelector('img')
  const originRect = origin?.getBoundingClientRect() ?? null
  const overlayRect = overlayRef.value?.getBoundingClientRect()
  const aspectRatio = resolveAspectRatio(originImage, originRect)
  const viewportWidth = overlayRef.value?.clientWidth || overlayRect?.width || window.innerWidth
  const viewportHeight = overlayRef.value?.clientHeight || overlayRect?.height || window.innerHeight
  const maxWidth = viewportWidth * 0.9
  const maxHeight = viewportHeight * 0.9
  let width = maxWidth
  let height = width / aspectRatio

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  destinationRect.value = { width, height }
}

const scheduleMeasure = () => {
  if (resizeFrame !== null)
    cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null
    measure()
  })
}

const cancelAnimations = () => {
  const animations = ownedAnimations
  ownedAnimations = []
  for (const animation of animations) {
    try {
      animation.commitStyles()
    }
    catch {}
    animation.cancel()
  }
}

const animatePhase = async () => {
  if (props.phase !== 'opening' && props.phase !== 'closing')
    return

  await nextTick()
  const overlay = overlayRef.value
  const backdrop = backdropRef.value
  const shell = shellRef.value
  const origin = props.originElement
  const rect = destinationRect.value

  if (!overlay || !backdrop || !shell || !origin || !rect)
    return

  const generation = ++animationGeneration
  cancelAnimations()
  const animations: Animation[] = []
  ownedAnimations = animations
  const originRect = origin.getBoundingClientRect()
  const shellRect = shell.getBoundingClientRect()
  const deltaX = originRect.left + originRect.width / 2 - shellRect.left - shellRect.width / 2
  const deltaY = originRect.top + originRect.height / 2 - shellRect.top - shellRect.height / 2
  const originTransform = `translate(${deltaX}px, ${deltaY}px) scale(${shellRect.width ? originRect.width / shellRect.width : 1}, ${shellRect.height ? originRect.height / shellRect.height : 1})`
  const computedTransform = getComputedStyle(shell).transform
  const computedOpacity = Number.parseFloat(getComputedStyle(backdrop).opacity)
  const continuing = previousPhase === 'opening' || previousPhase === 'closing'
  const fromTransform = continuing && computedTransform && computedTransform !== 'none' ? computedTransform : transformToCss(transform)
  const fromOpacity = continuing && Number.isFinite(computedOpacity) ? computedOpacity : props.phase === 'opening' ? 0 : 1

  previousPhase = props.phase
  overlay.focus({ preventScroll: true })

  const animate = (element: HTMLElement, keyframes: Keyframe[]) => {
    animations.push(element.animate(keyframes, {
      duration: FLIP_DURATION,
      easing: FLIP_EASING,
      fill: 'forwards',
    }))
  }

  if (props.phase === 'opening') {
    animate(shell, [
      { transform: continuing ? fromTransform : originTransform },
      { transform: 'translate(0, 0) scale(1)' },
    ])
    animate(backdrop, [{ opacity: fromOpacity }, { opacity: 1 }])
  }
  else {
    if (previewRef.value)
      previewRef.value.style.transform = transformToCss({ x: 0, y: 0, scale: 1 })
    animate(shell, [
      { transform: continuing ? fromTransform : transformToCss(transform) },
      { transform: originTransform },
    ])
    animate(backdrop, [{ opacity: fromOpacity }, { opacity: 0 }])
  }

  try {
    await Promise.all(animations.map(animation => animation.finished.catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        throw error
    })))
  }
  catch {
    return
  }

  if (generation !== animationGeneration || ownedAnimations !== animations)
    return

  for (const animation of animations) {
    try {
      animation.commitStyles()
    }
    catch {}
    animation.cancel()
  }
  ownedAnimations = []

  if (props.phase === 'opening') {
    if (shellRef.value)
      shellRef.value.style.transform = ''
    if (previewRef.value)
      previewRef.value.style.transform = transformToCss(transform)
    emit('openFinished')
  }
  else {
    emit('closeFinished')
  }
}

const startEnhancement = () => {
  const preview = props.previewSrc
  const generation = ++sourceGeneration

  if (!preview || preview === props.src) {
    sourceRequest = null
    return
  }

  const existing = sourceRequest?.src === props.src && sourceRequest.previewSrc === preview
    ? sourceRequest
    : { src: props.src, previewSrc: preview, promise: loadImage(preview) }
  sourceRequest = existing

  void existing.promise.then((ready) => {
    if (ready && generation === sourceGeneration && props.src === existing.src && props.previewSrc === existing.previewSrc)
      displaySrc.value = existing.previewSrc
  })
}

const setScale = (nextScale: number, anchor: Point, resetToBaseline = false) => {
  if (!props.zoomEnabled)
    return
  const current = { x: transform.x, y: transform.y }
  const scale = resetToBaseline ? 1 : clamp(nextScale, props.minZoom, props.maxZoom)
  if (scale === transform.scale)
    return
  if (scale === 1) {
    resetTransform()
    return
  }
  const shell = shellRef.value?.getBoundingClientRect()
  const center = shell
    ? { x: shell.left + shell.width / 2, y: shell.top + shell.height / 2 }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const position = getZoomAnchoredPosition(current, anchor, transform.scale, scale, center)
  transform.x = position.x
  transform.y = position.y
  transform.scale = scale
  writeTransform()
}

const installGestures = () => {
  const preview = previewRef.value
  if (!preview || !props.zoomEnabled)
    return () => {}

  const detector = createTrackpadDetector()
  let gestureOwner: 'idle' | 'drag' | 'pinch' = 'idle'
  let pointerId: number | null = null
  let lastPointer: Point = { x: 0, y: 0 }
  let pinchDistance = 0

  const finishDrag = () => {
    if (pointerId !== null) {
      try {
        if (typeof preview.releasePointerCapture === 'function')
          preview.releasePointerCapture(pointerId)
      }
      catch {}
    }
    pointerId = null
    if (gestureOwner === 'drag') {
      gestureOwner = 'idle'
      gesture.value = 'idle'
    }
  }
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const sensitivity = detector.detect(event) ? 0.01 : 0.002
    setScale(transform.scale - event.deltaY * sensitivity, { x: event.clientX, y: event.clientY })
  }
  const onDoubleClick = (event: MouseEvent) => {
    event.preventDefault()
    const baseline = transform.scale === 1
    setScale(baseline ? DOUBLE_CLICK_ZOOM : 1, { x: event.clientX, y: event.clientY }, !baseline)
  }
  const onPointerDown = (event: PointerEvent) => {
    if (gestureOwner !== 'idle')
      return
    event.preventDefault()
    if (typeof preview.setPointerCapture === 'function')
      preview.setPointerCapture(event.pointerId)
    pointerId = event.pointerId
    lastPointer = { x: event.clientX, y: event.clientY }
    gestureOwner = 'drag'
    gesture.value = 'drag'
  }
  const onPointerMove = (event: PointerEvent) => {
    if (gestureOwner !== 'drag' || event.pointerId !== pointerId)
      return
    event.preventDefault()
    transform.x += event.clientX - lastPointer.x
    transform.y += event.clientY - lastPointer.y
    lastPointer = { x: event.clientX, y: event.clientY }
    writeTransform()
  }
  const onPointerEnd = (event: PointerEvent) => {
    if (event.pointerId === pointerId)
      finishDrag()
  }
  const onTouchStart = (event: TouchEvent) => {
    const touches = getTwoTouches(event.touches)
    if (!touches)
      return
    event.preventDefault()
    finishDrag()
    pinchDistance = getTouchMetrics(...touches).distance
    gestureOwner = 'pinch'
    gesture.value = 'pinch'
  }
  const onTouchMove = (event: TouchEvent) => {
    if (gestureOwner !== 'pinch')
      return
    const touches = getTwoTouches(event.touches)
    if (!touches || pinchDistance <= 0)
      return
    event.preventDefault()
    const metrics = getTouchMetrics(...touches)
    setScale(transform.scale * (metrics.distance / pinchDistance), metrics.center)
    pinchDistance = metrics.distance
  }
  const onTouchEnd = (event: TouchEvent) => {
    if (gestureOwner === 'pinch' && event.touches.length < 2) {
      gestureOwner = 'idle'
      gesture.value = 'idle'
      pinchDistance = 0
    }
  }

  preview.addEventListener('wheel', onWheel, { passive: false })
  preview.addEventListener('dblclick', onDoubleClick)
  preview.addEventListener('pointerdown', onPointerDown)
  preview.addEventListener('pointermove', onPointerMove)
  preview.addEventListener('pointerup', onPointerEnd)
  preview.addEventListener('pointercancel', onPointerEnd)
  preview.addEventListener('touchstart', onTouchStart, { passive: false })
  preview.addEventListener('touchmove', onTouchMove, { passive: false })
  preview.addEventListener('touchend', onTouchEnd)
  preview.addEventListener('touchcancel', onTouchEnd)

  return () => {
    preview.removeEventListener('wheel', onWheel)
    preview.removeEventListener('dblclick', onDoubleClick)
    preview.removeEventListener('pointerdown', onPointerDown)
    preview.removeEventListener('pointermove', onPointerMove)
    preview.removeEventListener('pointerup', onPointerEnd)
    preview.removeEventListener('pointercancel', onPointerEnd)
    preview.removeEventListener('touchstart', onTouchStart)
    preview.removeEventListener('touchmove', onTouchMove)
    preview.removeEventListener('touchend', onTouchEnd)
    preview.removeEventListener('touchcancel', onTouchEnd)
    finishDrag()
    gestureOwner = 'idle'
    pinchDistance = 0
    gesture.value = 'idle'
    detector.reset()
  }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !props.closeOnEscape)
    return
  event.preventDefault()
  event.stopPropagation()
  emit('requestClose')
}

const onBackdropClick = (event: MouseEvent) => {
  if (!props.closeOnBackdropClick)
    return
  event.stopPropagation()
  emit('requestClose')
}

watch(() => props.src, (src, previous) => {
  if (src !== previous) {
    displaySrc.value = src
    sourceRequest = null
  }
  startEnhancement()
})
watch(() => props.previewSrc, startEnhancement)
watch(() => [props.minZoom, props.maxZoom] as const, () => {
  if (props.phase !== 'open' || transform.scale === 1)
    return

  const scale = clamp(transform.scale, props.minZoom, props.maxZoom)
  if (scale === transform.scale)
    return

  transform.scale = scale
  writeTransform()
})
watch(() => [props.phase, props.zoomEnabled] as const, ([phase]) => {
  if (phase === 'closing') {
    sourceGeneration++
    sourceRequest = null
  }
  if (phase === 'open') {
    cleanupGestures()
    cleanupGestures = installGestures()
  }
  else {
    cleanupGestures()
    cleanupGestures = () => {}
  }
  void animatePhase()
})
watch(() => props.container, () => {
  if (props.container === document.body)
    acquireBodyLock(owner)
  else
    releaseBodyLock(owner)
  scheduleMeasure()
})

onMounted(() => {
  overlayRef.value?.addEventListener('keydown', onKeyDown)
  if (props.container === document.body)
    acquireBodyLock(owner)
  measure()
  const image = props.originElement?.querySelector('img')
  image?.addEventListener('load', scheduleMeasure)
  window.addEventListener('resize', scheduleMeasure)
  resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure)
  if (overlayRef.value)
    resizeObserver?.observe(overlayRef.value)
  startEnhancement()
  void animatePhase()
})

onBeforeUnmount(() => {
  overlayRef.value?.removeEventListener('keydown', onKeyDown)
  const image = props.originElement?.querySelector('img')
  image?.removeEventListener('load', scheduleMeasure)
  window.removeEventListener('resize', scheduleMeasure)
  resizeObserver?.disconnect()
  if (resizeFrame !== null)
    cancelAnimationFrame(resizeFrame)
  if (transformFrame !== null)
    cancelAnimationFrame(transformFrame)
  cleanupGestures()
  cancelAnimations()
  animationGeneration++
  sourceGeneration++
  sourceRequest = null
  releaseBodyLock(owner)
})
</script>

<template>
  <div
    ref="overlayRef"
    class="hana-img-viewer-overlay"
    role="dialog"
    aria-modal="true"
    :aria-label="alt || 'Image preview'"
    tabindex="-1"
  >
    <div ref="backdropRef" class="hana-img-viewer-backdrop" aria-hidden="true" @click="onBackdropClick" />
    <div
      ref="shellRef"
      class="hana-img-viewer-flip-shell"
      :style="destinationRect ? { width: `${destinationRect.width}px`, height: `${destinationRect.height}px` } : undefined"
    >
      <img
        ref="previewRef"
        class="hana-img-viewer-preview"
        :src="displaySrc"
        :alt="alt"
        draggable="false"
        :style="{ cursor: phase === 'open' ? gesture === 'idle' ? 'grab' : 'grabbing' : 'default', transform: transformToCss(transform) }"
      >
    </div>
  </div>
</template>
