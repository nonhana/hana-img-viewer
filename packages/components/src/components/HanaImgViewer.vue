<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { useWindowScroll, useWindowSize } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useElementRect } from '../composables/useElementRect'
import { useEventListeners } from '../composables/useEventListeners'
import { useTransformer } from '../composables/useTransformer'
import { imgViewerPropsObj } from '../types'

defineOptions({ name: 'HanaImgViewer' })

const props = defineProps(imgViewerPropsObj)

// SSR 兼容标志
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const imgRef = ref<HTMLImageElement | null>(null)
const maskRef = ref<HTMLDivElement | null>(null)
const previewerRef = ref<HTMLImageElement | null>(null)

const displaying = ref(false)
const applyingPreviewStyles = ref(false)
const isAnimating = ref(false)

function animatingTrigger() {
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, props.duration)
}

const imgStyle = computed<CSSProperties>(() => ({
  width: (typeof props.width === 'number' ? `${props.width}px` : props.width) ?? 'fit-content',
  height: (typeof props.height === 'number' ? `${props.height}px` : props.height) ?? 'fit-content',
  visibility: displaying.value ? 'hidden' : 'visible',
}))

function toggleDisplay() {
  animatingTrigger()

  if (displaying.value) {
    applyingPreviewStyles.value = false
    setTimeout(() => {
      displaying.value = false
    }, props.duration)
  }
  else {
    displaying.value = true
  }
}

// 在 transformerApi 使用之前保证客户端环境
type TransformerApi = ReturnType<typeof useTransformer>
const transformerApi = ref<TransformerApi>({
  handleWheel: () => {},
  handleTouchStart: () => {},
  handleDblclick: () => {},
  handleMouseDown: () => {},
  initTransformer: () => {},
  cleanupListeners: () => {},
})

onMounted(() => {
  // 仅在客户端挂载后初始化变换功能
  transformerApi.value = useTransformer(previewerRef, props)
})

onBeforeUnmount(() => {
  // 确保在组件卸载前清理事件监听
  transformerApi.value.cleanupListeners()
})

const previewerDblclick = ref<(() => void) | undefined>()
const previewerMouseDown = ref<((e: MouseEvent) => void) | undefined>()

// 仅在客户端环境下创建rect对象
const { rect: imgRect } = useElementRect(imgRef, {
  throttle: true,
  throttleDelay: 100,
})

const imgAspectRatio = computed(() => imgRect.value ? (imgRect.value.width / imgRect.value.height) : 0)

// 使用 vueuse 确保 SSR 兼容
const { width, height } = useWindowSize()
const windowAspectRatio = computed(() => width.value / height.value)

const { x: scrollX, y: scrollY } = useWindowScroll()

const transitionDuration = computed(() => `${props.duration}ms`)

const previewerInitialWidth = computed(() => {
  if (!imgRect.value)
    return 'auto'
  return imgAspectRatio.value > windowAspectRatio.value ? `${imgRect.value.width}px` : 'auto'
})

const previewerInitialHeight = computed(() => {
  if (!imgRect.value)
    return 'auto'
  return imgAspectRatio.value > windowAspectRatio.value ? 'auto' : `${imgRect.value.height}px`
})

const previewerInitialTop = computed(() => {
  if (!imgRect.value)
    return '0px'
  return `${imgRect.value.top + scrollY.value}px`
})

const previewerInitialLeft = computed(() => {
  if (!imgRect.value)
    return '0px'
  return `${imgRect.value.left + scrollX.value}px`
})

const previewerTargetWidth = computed(() =>
  imgAspectRatio.value > windowAspectRatio.value ? `${props.previewMaxWidth}` : 'auto',
)

const previewerTargetHeight = computed(() =>
  imgAspectRatio.value > windowAspectRatio.value ? 'auto' : `${props.previewMaxHeight}`,
)

const previewerTargetTop = computed(() => `calc(50vh + ${scrollY.value}px)`)

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && displaying.value) {
    toggleDisplay()
  }
}

// 客户端专用的事件监听管理
type EventListenerApi = ReturnType<typeof useEventListeners>
const eventListenerApi = ref<EventListenerApi>({
  toggleEventListener: (_type: 'on' | 'off') => {},
})

onMounted(() => {
  eventListenerApi.value = useEventListeners({
    handleWheel: transformerApi.value.handleWheel,
    handleTouchStart: transformerApi.value.handleTouchStart,
    handleKeyDown,
  })
})

const maskStyle = computed(() => ({
  opacity: applyingPreviewStyles.value ? props.maskOpacity : 0,
}))

const previewerStyle = computed(() => ({
  transition: isAnimating.value ? `all ${transitionDuration.value}` : 'none',
  width: applyingPreviewStyles.value ? previewerTargetWidth.value : previewerInitialWidth.value,
  height: applyingPreviewStyles.value ? previewerTargetHeight.value : previewerInitialHeight.value,
  top: applyingPreviewStyles.value ? previewerTargetTop.value : previewerInitialTop.value,
  left: applyingPreviewStyles.value ? '50%' : previewerInitialLeft.value,
  transform: applyingPreviewStyles.value ? 'translate(-50%, -50%)' : 'none',
}))

watch(displaying, (isDisplaying) => {
  transformerApi.value.initTransformer()

  if (isDisplaying) {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
    requestAnimationFrame(() => {
      applyingPreviewStyles.value = true
    })
  }
  else {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'auto'
    }
  }
})

watch([displaying, isAnimating], ([isDisplaying, isCurrentlyAnimating], [wasDisplaying, wasAnimating]) => {
  const shouldBindEvents = isDisplaying && !isCurrentlyAnimating && wasDisplaying && wasAnimating && applyingPreviewStyles.value
  const shouldUnbindEvents = isDisplaying && isCurrentlyAnimating && wasDisplaying && !wasAnimating

  if (shouldBindEvents) {
    previewerDblclick.value = transformerApi.value.handleDblclick
    previewerMouseDown.value = transformerApi.value.handleMouseDown
    eventListenerApi.value.toggleEventListener('on')
  }

  if (shouldUnbindEvents) {
    eventListenerApi.value.toggleEventListener('off')
    previewerMouseDown.value = undefined
    previewerDblclick.value = undefined
  }
})
</script>

<template>
  <Teleport v-if="isMounted" to="body">
    <div
      v-if="displaying"
      ref="maskRef"
      :style="{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: maskBgColor,
        zIndex: previewZIndex - 1,
        transition: `all ${transitionDuration}`,
        ...maskStyle,
      }"
      @click="toggleDisplay"
    />
  </Teleport>

  <Teleport v-if="isMounted" to="body">
    <img
      v-if="displaying"
      ref="previewerRef"
      :src="src"
      draggable="false"
      :style="{
        position: 'absolute',
        objectFit: 'cover',
        cursor: 'grab',
        zIndex: previewZIndex,
        ...previewerStyle,
      }"
      @dblclick="previewerDblclick"
      @mousedown="previewerMouseDown"
    >
  </Teleport>

  <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
    <div :style="imgStyle">
      <img
        ref="imgRef"
        :src="src"
        :alt="alt"
        style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
        @click="toggleDisplay"
      >
    </div>
    <span v-if="alt" style="font-size: 0.8rem; color: #666;">{{ alt }}</span>
  </div>
</template>
