<script setup lang="ts">
import type { CSSProperties, StyleValue } from 'vue'
import type { ViewerEvent, ViewerPhase } from './internal/viewerState'
import type { HanaImgViewerProps } from './public-types'
import { computed, nextTick, onMounted, ref, shallowRef, useAttrs, useTemplateRef, watch, watchEffect } from 'vue'
import ViewerOverlay from './internal/ViewerOverlay.vue'
import { initialViewerPhase, transitionViewerPhase } from './internal/viewerState'

defineOptions({ name: 'HanaImgViewer', inheritAttrs: false })

const props = withDefaults(
  defineProps<HanaImgViewerProps>(),
  {
    as: 'div',
    alt: '',
    minZoom: 0.5,
    maxZoom: 10,
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showCloseButton: true,
    transitionDuration: 300,
  },
)

const openModel = defineModel<boolean>('open', { default: false })

const attrs = useAttrs()

const originRef = useTemplateRef<HTMLElement>('originRef')
const thumbnailRef = useTemplateRef<HTMLImageElement>('thumbnailRef')

const hydrated = ref(false)

const requestedTarget = shallowRef<HTMLElement | null>(null)
const activeTarget = shallowRef<HTMLElement | null>(null)

const phase = ref<ViewerPhase>(initialViewerPhase)

const originFocus = shallowRef<HTMLElement | null>(null)

const overlayMounted = computed(() => phase.value !== 'closed' && activeTarget.value !== null)
const rootAttrs = computed(() => Object.fromEntries(
  Object.entries(attrs).filter(([attributeName]) => attributeName !== 'class' && attributeName !== 'style'),
))
const thumbnailStyle = computed<StyleValue>(() => [
  {
    display: 'inline-block',
  },
  attrs.style,
  {
    ...(overlayMounted.value
      ? { visibility: 'hidden' as CSSProperties['visibility'] }
      : {}),
  },
])

const dispatch = (event: ViewerEvent) => {
  phase.value = transitionViewerPhase(phase.value, event)
}

const requestOpen = () => openModel.value = true

const requestClose = () => openModel.value = false

watchEffect(() => {
  if (!hydrated.value) {
    requestedTarget.value = null
    return
  }
  requestedTarget.value = props.container === undefined ? document.body : props.container
})

watch(
  () => [openModel.value === true, requestedTarget.value, phase.value, activeTarget.value] as const,
  ([desiredOpen, target, currentPhase, currentTarget]) => {
    if (currentPhase === 'closed') {
      if (desiredOpen && target && currentTarget !== target) {
        activeTarget.value = target
        originFocus.value = thumbnailRef.value
        dispatch({ type: 'SHOW' })
      }
      else if ((!desiredOpen || !target) && currentTarget) {
        activeTarget.value = null
      }
      return
    }

    if (target !== currentTarget || !desiredOpen) {
      dispatch({ type: 'HIDE' })
      return
    }

    dispatch({ type: 'SHOW' })
  },
  { flush: 'sync' },
)

const handleOpenFinished = () => dispatch({ type: 'OPEN_FINISHED' })
const handleCloseFinished = async () => {
  dispatch({ type: 'CLOSE_FINISHED' })
  await nextTick()
  if (phase.value === 'closed') {
    activeTarget.value = null
    const focusTarget = originFocus.value
    originFocus.value = null
    focusTarget?.focus({ preventScroll: true })
  }
}

watch(phase, (next) => {
  if (next === 'closed' && !openModel.value)
    activeTarget.value = null
})

onMounted(() => {
  hydrated.value = true
})
</script>

<template>
  <component :is="as" ref="originRef" class="hana-img-viewer-thumbnail-root" :class="attrs.class" :style="thumbnailStyle" v-bind="rootAttrs">
    <img
      ref="thumbnailRef"
      class="hana-img-viewer-thumbnail"
      :src="src"
      :alt="alt"
      role="button"
      tabindex="0"
      @click="requestOpen"
      @keydown.enter.prevent="requestOpen"
      @keydown.space.prevent="requestOpen"
    >
  </component>

  <Teleport v-if="activeTarget && phase !== 'closed'" :to="activeTarget">
    <ViewerOverlay
      :phase="phase"
      :container="activeTarget"
      :origin-element="originRef"
      :src="src"
      :preview-src="previewSrc"
      :alt="alt"
      :min-zoom="minZoom"
      :max-zoom="maxZoom"
      :transition-duration="transitionDuration"
      :close-on-backdrop-click="closeOnBackdropClick"
      :close-on-escape="closeOnEscape"
      :show-close-button="showCloseButton"
      @request-close="requestClose"
      @open-finished="handleOpenFinished"
      @close-finished="handleCloseFinished"
    />
  </Teleport>
</template>
