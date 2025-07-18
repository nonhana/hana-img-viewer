<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { useAdaptivePreview } from '../composables/useAdaptivePreview'
import { useElementRect } from '../composables/useElementRect'
import { useEventListeners } from '../composables/useEventListeners'
import { useTransformer } from '../composables/useTransformer'
import { useWindowState } from '../composables/useWindowState'
import { imgViewerEmitsObj, imgViewerPropsObj } from '../types'
import { getCorrectInitialPosition } from '../utils'

defineOptions({ name: 'HanaImgViewer' })

const props = defineProps(imgViewerPropsObj)
const emit = defineEmits(imgViewerEmitsObj)

const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const imgRef = ref<HTMLImageElement | null>(null)
const maskRef = ref<HTMLDivElement | null>(null)
const previewerRef = ref<HTMLImageElement | null>(null)

const _displaying = ref(false)
const _applyingPreviewStyles = ref(false)
const _isAnimating = ref(false)

const displaying = computed({
  get: () => props.displaying !== undefined ? props.displaying : _displaying.value,
  set: (value) => {
    if (props.displaying !== undefined) {
      emit('update:displaying', value)
    }
    else {
      _displaying.value = value
    }
    emit('displayChange', value)
  },
})

const applyingPreviewStyles = computed({
  get: () => props.applyingPreviewStyles !== undefined ? props.applyingPreviewStyles : _applyingPreviewStyles.value,
  set: (value) => {
    if (props.applyingPreviewStyles !== undefined) {
      emit('update:applyingPreviewStyles', value)
    }
    else {
      _applyingPreviewStyles.value = value
    }
    emit('previewStylesChange', value)
  },
})

const isAnimating = computed({
  get: () => props.isAnimating !== undefined ? props.isAnimating : _isAnimating.value,
  set: (value) => {
    if (props.isAnimating !== undefined) {
      emit('update:isAnimating', value)
    }
    else {
      _isAnimating.value = value
    }
    emit('animatingChange', value)
  },
})

watch(() => props.displaying, (newVal) => {
  if (newVal !== undefined && newVal !== _displaying.value) {
    _displaying.value = newVal
  }
})

watch(() => props.applyingPreviewStyles, (newVal) => {
  if (newVal !== undefined && newVal !== _applyingPreviewStyles.value) {
    _applyingPreviewStyles.value = newVal
  }
})

watch(() => props.isAnimating, (newVal) => {
  if (newVal !== undefined && newVal !== _isAnimating.value) {
    _isAnimating.value = newVal
  }
})

// 触发动画
function animatingTrigger() {
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, props.duration)
}

// 位置更新触发器
const positionUpdateTrigger = ref(0)

const imgStyle = computed<CSSProperties>(() => ({
  width: (typeof props.width === 'number' ? `${props.width}px` : props.width) ?? 'fit-content',
  height: (typeof props.height === 'number' ? `${props.height}px` : props.height) ?? 'fit-content',
  visibility: displaying.value ? 'hidden' : 'visible',
}))

function toggleDisplay() {
  if (isAnimating.value)
    return

  // 在开始显示之前，强制更新位置计算
  if (!displaying.value) {
    positionUpdateTrigger.value++
  }

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

type TransformerApi = ReturnType<typeof useTransformer>
const transformerApi = shallowRef<TransformerApi | null>(null)

onMounted(() => {
  transformerApi.value = useTransformer(previewerRef, props)
})

onBeforeUnmount(() => {
  transformerApi.value?.cleanupListeners()
})

const previewerEvents = ref<{
  dblclick?: (() => void)
  mousedown?: ((e: MouseEvent) => void)
}>({})

const { rect: imgRect } = useElementRect(imgRef, {
  throttle: true,
  throttleDelay: 100,
})

const { finalZIndex, isInModal: _isInModal } = useAdaptivePreview({
  imgRef,
  props,
})

const imgAspectRatio = computed(() => imgRect.value ? (imgRect.value.width / imgRect.value.height) : 0)

const { width, height, scrollX, scrollY } = useWindowState()

// 移除了初始滚动位置的追踪，因为现在使用实时滚动位置进行更精确的计算

const windowAspectRatio = computed(() => width.value / height.value)

const transitionDuration = computed(() => `${props.duration}ms`)

const previewerInitialWidth = computed(() =>
  imgRect.value
    ? imgAspectRatio.value > windowAspectRatio.value
      ? `${imgRect.value.width}px`
      : 'auto'
    : 'auto',
)

const previewerInitialHeight = computed(() =>
  imgRect.value
    ? imgAspectRatio.value > windowAspectRatio.value
      ? 'auto'
      : `${imgRect.value.height}px`
    : 'auto',
)

// 获取当前实时位置的函数
function getCurrentRealTimePosition() {
  if (!imgRef.value) return { top: 0, left: 0 }
  return getCorrectInitialPosition(imgRef.value, scrollX.value, scrollY.value)
}

const previewerInitialTop = computed(() => {
  // 添加触发器作为依赖，确保能重新计算
  const _ = positionUpdateTrigger.value
  
  const position = getCurrentRealTimePosition()
  return `${position.top}px`
})

const previewerInitialLeft = computed(() => {
  // 添加触发器作为依赖，确保能重新计算
  const _ = positionUpdateTrigger.value
  
  const position = getCurrentRealTimePosition()
  return `${position.left}px`
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

type EventListenerApi = ReturnType<typeof useEventListeners>
const eventListenerApi = ref<EventListenerApi>({
  toggleEventListener: (_type: 'on' | 'off') => {},
})

watchEffect(() => {
  if (transformerApi.value) {
    eventListenerApi.value = useEventListeners({
      handleWheel: transformerApi.value.handleWheel,
      handleTouchStart: transformerApi.value.handleTouchStart,
      handleKeyDown,
    })
  }
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

watchEffect(() => {
  transformerApi.value?.initTransformer()

  if (displaying.value) {
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
  if (!transformerApi.value)
    return

  const shouldBindEvents = isDisplaying && !isCurrentlyAnimating && wasDisplaying && wasAnimating && applyingPreviewStyles.value
  const shouldUnbindEvents = isDisplaying && isCurrentlyAnimating && wasDisplaying && !wasAnimating

  if (shouldBindEvents) {
    previewerEvents.value = {
      dblclick: transformerApi.value.handleDblclick,
      mousedown: transformerApi.value.handleMouseDown,
    }
    eventListenerApi.value.toggleEventListener('on')
  }

  if (shouldUnbindEvents) {
    eventListenerApi.value.toggleEventListener('off')
    previewerEvents.value = {}
  }
})
</script>

<template>
  <!-- mask 遮罩层 -->
  <Teleport v-if="isMounted" to="body">
    <div
      v-if="displaying"
      ref="maskRef"
      :style="{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: maskBgColor,
        zIndex: finalZIndex - 1,
        transition: `all ${transitionDuration}`,
        opacity: maskStyle.opacity,
      }"
      @click="toggleDisplay"
    />
  </Teleport>

  <!-- 预览图 -->
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
        zIndex: finalZIndex,
        ...previewerStyle,
      }"
      v-on="previewerEvents"
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
