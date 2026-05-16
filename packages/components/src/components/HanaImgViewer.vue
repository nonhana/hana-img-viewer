<script setup lang="ts">
import type { CSSProperties, HTMLAttributes, StyleValue } from 'vue'
import type {
  EmitsType,
  HanaImgViewerExposed,
  PropsType,
  ViewerInteractionPhase,
} from '@/types'
import { computed, getCurrentInstance, nextTick, shallowRef, useTemplateRef, watch } from 'vue'
import { DEFAULT_FLIP_DURATION, DEFAULT_FLIP_EASING, useFLIP } from '@/composables/core'
import { useEventListener } from '@/composables/utils'
import {
  useBodyLock,
  usePortalTarget,
  useViewerGeometry,
  useViewerInteractions,
  useViewerOpenState,
  useViewerSource,
  useViewerTransform,
} from '@/composables/viewer'
import { defaultProps } from '@/types'

defineOptions({ name: 'HanaImgViewer' })

const props = withDefaults(defineProps<PropsType>(), defaultProps)
const emit = defineEmits<EmitsType>()
const instance = getCurrentInstance()

const thumbnailContainerRef = useTemplateRef('thumbnailContainerRef')
const thumbnailRef = useTemplateRef('thumbnailRef')
const backdropRef = useTemplateRef('backdropRef')
const flipRef = useTemplateRef('flipRef')
const previewRef = useTemplateRef('previewRef')

const phase = shallowRef<ViewerInteractionPhase>('closed')
const transitionRunId = shallowRef(0)
const closingTransform = shallowRef<{ x: number, y: number, scale: number } | null>(null)
const pendingImmediateOpen = shallowRef(false)
const suppressNextOpenEmit = shallowRef(false)
const enhancementEmitted = shallowRef(false)
const sourceErrorEmitted = shallowRef(false)
const isControlled = computed(() => Object.hasOwn(instance?.vnode.props ?? {}, 'open'))

const { isOpen } = useViewerOpenState({
  open: () => props.open,
  isControlled: () => isControlled.value,
  onOpenChange: value => emit('update:open', value),
})

const thumbnailGeometryTarget = computed(() => thumbnailRef.value ?? thumbnailContainerRef.value ?? null)

const {
  destinationRect,
  captureThumbnailRect,
  prepareDestinationRect,
  resetDestinationRect,
  getViewportCenter,
} = useViewerGeometry({
  thumbnailTarget: thumbnailGeometryTarget,
  thumbnailImage: thumbnailRef,
})

const {
  transform,
  style: transformStyle,
  setScale,
  pan,
  toggleDoubleClickZoom,
  reset: resetTransform,
} = useViewerTransform({
  minScale: () => props.minZoom,
  maxScale: () => props.maxZoom,
})

const {
  displaySrc,
  sourcePhase,
  beginSession,
  endSession,
  reset: resetSource,
  startEnhancement,
} = useViewerSource({
  src: () => props.src,
  previewSrc: () => props.previewSrc,
})

const {
  isMounted,
  mode: portalMode,
  resolvedTarget,
  canMountOverlay,
  isBodyTarget,
} = usePortalTarget(() => props.portalTarget)

const { lock: lockBody, unlock: unlockBody } = useBodyLock()

const {
  flip,
  flipReverse,
  cancel: cancelAnimation,
} = useFLIP({
  duration: DEFAULT_FLIP_DURATION,
  easing: DEFAULT_FLIP_EASING,
})

let backdropAnimation: Animation | null = null

const {
  isDragging,
  isPinching,
  isWheeling,
} = useViewerInteractions({
  target: previewRef,
  zoomTarget: flipRef,
  enabled: () => phase.value === 'open',
  enableDrag: () => props.enableDrag,
  enableZoom: () => props.enableZoom,
  enableKeyboard: () => props.enableKeyboard && isBodyTarget.value,
  onPan: delta => pan(delta),
  onWheelZoom: (delta, anchor) => setScale(transform.value.scale + delta, anchor),
  onPinchZoom: (deltaScale, anchor) => setScale(transform.value.scale * deltaScale, anchor),
  onDoubleClick: (anchor) => {
    toggleDoubleClickZoom(anchor)
  },
  onEscape: () => {
    void closePreview()
  },
  getViewportCenter,
})

const isOverlayMounted = computed(() => phase.value !== 'closed')
const isInteractive = computed(() => phase.value === 'open')
const isInteracting = computed(() => isDragging.value || isPinching.value || isWheeling.value)
const previewCursor = computed<CSSProperties['cursor']>(() => {
  if (!isInteractive.value || !props.enableDrag)
    return 'default'

  return isInteracting.value ? 'grabbing' : 'grab'
})

const thumbnailContainerStyle = computed<StyleValue>(() => [
  {
    display: 'inline-block',
    visibility: isOverlayMounted.value ? 'hidden' : 'visible',
  } satisfies CSSProperties,
  props.containerStyle,
])

const thumbnailStyle = computed<StyleValue>(() => [
  {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer',
  } satisfies CSSProperties,
  props.thumbnailStyle,
])

const overlayStyle = computed<StyleValue>(() => [
  {
    pointerEvents: isOverlayMounted.value ? 'auto' : 'none',
  } satisfies CSSProperties,
])

const backdropStyle = computed<CSSProperties>(() => ({
  opacity: phase.value === 'opening' ? 0 : 1,
}))

const flipShellStyle = computed<StyleValue>(() => {
  const rect = destinationRect.value
  const shellTransform = closingTransform.value
    ? `translate3d(${closingTransform.value.x}px, ${closingTransform.value.y}px, 0) scale(${closingTransform.value.scale})`
    : 'none'

  return [
    {
      width: rect ? `${rect.width}px` : undefined,
      height: rect ? `${rect.height}px` : undefined,
      transform: shellTransform,
      transformOrigin: 'center center',
    } satisfies CSSProperties,
  ]
})

const previewStyle = computed<CSSProperties>(() => ({
  transform: closingTransform.value ? 'none' : transformStyle.value,
  transformOrigin: 'center center',
  willChange: isInteractive.value ? 'transform' : 'auto',
  cursor: previewCursor.value,
}))

function cancelBackdropAnimation(): void {
  if (!backdropAnimation)
    return

  backdropAnimation.cancel()
  backdropAnimation = null
}

async function animateBackdropOpacity(targetOpacity: number): Promise<void> {
  const backdropEl = backdropRef.value

  if (!backdropEl)
    return

  const currentOpacity = Number.parseFloat(window.getComputedStyle(backdropEl).opacity)
  const fromOpacity = Number.isFinite(currentOpacity)
    ? currentOpacity
    : targetOpacity === 0 ? 1 : 0

  if (Math.abs(fromOpacity - targetOpacity) < 0.001)
    return

  cancelBackdropAnimation()

  try {
    backdropAnimation = backdropEl.animate(
      [
        { opacity: fromOpacity },
        { opacity: targetOpacity },
      ],
      {
        duration: DEFAULT_FLIP_DURATION,
        easing: DEFAULT_FLIP_EASING,
        fill: 'forwards',
      },
    )

    await backdropAnimation.finished

    if (backdropAnimation) {
      backdropAnimation.commitStyles()
      backdropAnimation.cancel()
    }
  }
  catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      throw error
    }
  }
  finally {
    backdropAnimation = null
  }
}

function buildRect(rect: { left: number, top: number, width: number, height: number }): DOMRect {
  return new DOMRect(rect.left, rect.top, rect.width, rect.height)
}

function emitSourceEvents(): void {
  if (sourcePhase.value === 'enhanced' && !enhancementEmitted.value) {
    enhancementEmitted.value = true
    emit('load', new Event('load'))
  }

  if (sourcePhase.value === 'enhance-error' && !sourceErrorEmitted.value) {
    sourceErrorEmitted.value = true
    emit('error', new Event('error'))
  }
}

function resetOverlaySessionState(): void {
  cancelAnimation()
  cancelBackdropAnimation()
  closingTransform.value = null
  enhancementEmitted.value = false
  sourceErrorEmitted.value = false
  resetTransform()
  resetSource()
  resetDestinationRect()
}

function finalizeClosedState(): void {
  phase.value = 'closed'
  if (!isControlled.value) {
    isOpen.value = false
  }
  resetOverlaySessionState()
  unlockBody()
  emit('close')
}

function cancelPendingOpen(): void {
  pendingImmediateOpen.value = false
  suppressNextOpenEmit.value = false
  isOpen.value = false
  resetOverlaySessionState()
  unlockBody()
}

async function runEnhancement(sessionToken: number): Promise<void> {
  await startEnhancement(sessionToken)
  emitSourceEvents()
}

async function enterOpenFlow(skipFlip: boolean): Promise<void> {
  if (!canMountOverlay.value)
    return

  const sessionToken = beginSession()
  transitionRunId.value += 1
  const runId = transitionRunId.value

  phase.value = skipFlip ? 'open' : 'opening'
  isOpen.value = true
  closingTransform.value = null
  enhancementEmitted.value = false
  sourceErrorEmitted.value = false
  resetTransform()
  prepareDestinationRect()

  if (isBodyTarget.value) {
    lockBody()
  }

  await nextTick()

  if (runId !== transitionRunId.value || !isOpen.value) {
    return
  }

  const motionTasks: Array<Promise<void>> = [animateBackdropOpacity(1)]

  if (!skipFlip) {
    const thumbnailEl = captureThumbnailRect()
    const flipEl = flipRef.value

    if (thumbnailEl && flipEl) {
      const to = flipEl.getBoundingClientRect()
      motionTasks.push(flip(thumbnailEl, to, flipEl))
    }
  }

  await Promise.all(motionTasks)

  if (runId !== transitionRunId.value || !isOpen.value) {
    return
  }

  phase.value = 'open'

  if (suppressNextOpenEmit.value) {
    suppressNextOpenEmit.value = false
  }
  else {
    emit('open')
  }

  void runEnhancement(sessionToken)
}

async function openPreview(): Promise<void> {
  if (phase.value !== 'closed')
    return

  if (!isMounted.value) {
    pendingImmediateOpen.value = true
    isOpen.value = true
    return
  }

  if (!canMountOverlay.value) {
    isOpen.value = true
    return
  }

  const skipFlip = pendingImmediateOpen.value
  pendingImmediateOpen.value = false
  await enterOpenFlow(skipFlip)
}

async function closePreview(): Promise<void> {
  if (phase.value === 'closing')
    return

  if (phase.value === 'closed') {
    if (isOpen.value || pendingImmediateOpen.value) {
      cancelPendingOpen()
    }

    return
  }

  if (isControlled.value) {
    isOpen.value = false
    return
  }

  await closePreviewInternal()
}

async function closePreviewInternal(): Promise<void> {
  if (phase.value === 'closed' || phase.value === 'closing')
    return

  transitionRunId.value += 1
  const runId = transitionRunId.value
  phase.value = 'closing'
  endSession()

  const flipEl = flipRef.value
  const thumbnailRect = captureThumbnailRect()
  const rect = destinationRect.value

  closingTransform.value = {
    x: transform.value.x,
    y: transform.value.y,
    scale: transform.value.scale,
  }

  resetTransform()

  await nextTick()

  if (runId !== transitionRunId.value) {
    return
  }

  const motionTasks: Array<Promise<void>> = [animateBackdropOpacity(0)]

  if (flipEl && thumbnailRect && rect) {
    motionTasks.push(
      flipReverse(
        buildRect(rect),
        thumbnailRect,
        flipEl,
        closingTransform.value ?? undefined,
      ),
    )
  }

  await Promise.all(motionTasks)

  if (runId !== transitionRunId.value) {
    return
  }

  finalizeClosedState()
}

function reset(): void {
  resetTransform()
}

function handleBackdropClick(): void {
  if (!props.closeOnMaskClick)
    return

  void closePreview()
}

watch(sourcePhase, () => {
  emitSourceEvents()
})

watch(() => props.src, () => {
  if (phase.value === 'closed') {
    resetSource()
    return
  }

  enhancementEmitted.value = false
  sourceErrorEmitted.value = false

  const sessionToken = beginSession()

  if (phase.value === 'open')
    void runEnhancement(sessionToken)
})

watch(() => props.previewSrc, () => {
  if (phase.value === 'open') {
    enhancementEmitted.value = false
    sourceErrorEmitted.value = false
    const sessionToken = beginSession({ resetToBase: false })
    void runEnhancement(sessionToken)
  }
})

watch(
  [() => isMounted.value, () => canMountOverlay.value, () => portalMode.value, () => props.open],
  async ([mounted, mountable, mode]) => {
    if (!isControlled.value)
      return

    if (!mounted) {
      if (props.open) {
        pendingImmediateOpen.value = true
        suppressNextOpenEmit.value = true
        isOpen.value = true
      }

      return
    }

    if (props.open) {
      if (phase.value === 'closed') {
        if (mode === 'pending' || !mountable) {
          pendingImmediateOpen.value = true
          isOpen.value = true
          return
        }

        await openPreview()
      }

      return
    }

    pendingImmediateOpen.value = false
    suppressNextOpenEmit.value = false

    if (phase.value !== 'closed') {
      await closePreviewInternal()
      return
    }

    resetOverlaySessionState()
    unlockBody()
  },
  { immediate: true },
)

watch(isBodyTarget, (nextValue, previousValue) => {
  if (!isOverlayMounted.value || nextValue === previousValue)
    return

  if (nextValue)
    lockBody()
  else
    unlockBody()
})

watch(
  () => canMountOverlay.value,
  async (mountable) => {
    if (!mountable || !isOpen.value || phase.value !== 'closed')
      return

    const skipFlip = pendingImmediateOpen.value
    pendingImmediateOpen.value = false
    await enterOpenFlow(skipFlip)
  },
)

useEventListener(
  () => phase.value === 'open' ? window : null,
  'resize',
  () => {
    prepareDestinationRect()
  },
)

defineExpose<HanaImgViewerExposed>({
  open: openPreview,
  close: closePreview,
  reset,
})
</script>

<template>
  <div
    ref="thumbnailContainerRef"
    :class="props.containerClass"
    :style="thumbnailContainerStyle"
  >
    <slot name="thumbnail" :open="openPreview">
      <img
        ref="thumbnailRef"
        :src="src"
        :alt="alt"
        :class="props.thumbnailClass as HTMLAttributes['class']"
        :style="thumbnailStyle"
        role="button"
        tabindex="0"
        @click="openPreview"
        @keydown.enter.prevent="openPreview"
        @keydown.space.prevent="openPreview"
      >
    </slot>
  </div>

  <Teleport v-if="isMounted && resolvedTarget" :to="resolvedTarget">
    <div
      v-if="isOverlayMounted"
      class="hana-img-viewer-overlay"
      :style="overlayStyle"
    >
      <div
        ref="backdropRef"
        class="hana-img-viewer-backdrop"
        :style="backdropStyle"
        @click="handleBackdropClick"
      />
      <div
        ref="flipRef"
        class="hana-img-viewer-flip-shell"
        :style="flipShellStyle"
      >
        <img
          ref="previewRef"
          :src="displaySrc"
          :alt="alt"
          class="hana-img-viewer-preview"
          :style="previewStyle"
          draggable="false"
        >
      </div>
    </div>
  </Teleport>
</template>
