<script setup lang="ts">
import type { CSSProperties, HTMLAttributes, StyleValue } from 'vue'
import type { EmitsType, PropsType } from '@/types'
import { computed, getCurrentInstance, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useFLIP, useGesture, useTransform, useZoom } from '@/composables/core'
import { useControllable, useEventListener, useScrollLock } from '@/composables/utils'
import { defaultProps } from '@/types'

defineOptions({ name: 'HanaImgViewer' })

const props = withDefaults(defineProps<PropsType>(), defaultProps)
const emit = defineEmits<EmitsType>()
const instance = getCurrentInstance()

// ===== 模板引用 =====
const thumbnailRef = useTemplateRef('thumbnailRef')
const previewRef = useTemplateRef('previewRef')

// ===== 图片加载状态 =====
type LoadState = 'idle' | 'loading' | 'loaded' | 'error'
const loadState = ref<LoadState>('idle')

// ===== 客户端挂载检测 =====
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

// ===== 受控状态管理 =====
const isOpen = useControllable({
  prop: () => props.open,
  isControlled: () => {
    const vnodeProps = instance?.vnode.props ?? {}
    return Object.hasOwn(vnodeProps, 'open')
      || Object.hasOwn(vnodeProps, 'onUpdate:open')
  },
  defaultValue: false,
  onChange: (value) => {
    emit('update:open', value)
    if (value) {
      emit('open')
    }
    else {
      emit('close')
    }
  },
})

// 遮罩层单独管理
const isMaskOpen = ref(false)

// ===== 缩放管理 =====
const {
  zoom,
  zoomIn,
  zoomOut,
  setZoom,
  toggleDoubleClickZoom,
  reset: resetZoom,
  canZoomIn,
  canZoomOut,
  isInitialZoom,
} = useZoom({
  initialZoom: 1,
  minZoom: () => props.minZoom,
  maxZoom: () => props.maxZoom,
  step: () => props.zoomStep,
  doubleClickZoom: () => props.doubleClickZoom,
  onZoomChange: (z) => {
    emit('update:zoom', z)
    emit('zoomChange', z)
  },
})

// 同步外部 zoom prop
watch(() => props.zoom, (newZoom) => {
  if (newZoom !== undefined && newZoom !== zoom.value) {
    setZoom(newZoom)
  }
})

// ===== 变换管理 =====
const {
  transform,
  style: transformStyle,
  set: setTransform,
  zoomAt,
  pan,
  reset: resetTransform,
} = useTransform({
  initial: { x: 0, y: 0, scale: 1, rotate: 0 },
  scaleRange: () => ({ min: props.minZoom, max: props.maxZoom }),
})

// 同步 zoom 和 transform.scale
watch(zoom, (newZoom) => {
  if (Math.abs(newZoom - transform.value.scale) > 0.001) {
    setTransform({ scale: newZoom })
  }
})

// ===== FLIP 动画 =====
const {
  isAnimating,
  flip,
  flipReverse,
  cancel: cancelAnimation,
} = useFLIP({
  duration: () => props.duration,
  easing: () => props.easing,
})

// ===== 滚动锁定 =====
const { lock: lockScroll, unlock: unlockScroll } = useScrollLock()

// ===== 手势管理 =====
const {
  isDragging,
  isPinching,
  isWheeling,
  isInteracting,
} = useGesture({
  target: previewRef,
  enabled: () => isOpen.value && !isAnimating.value,
  enableDrag: () => props.enableDrag,
  enablePinch: () => props.enablePinch,
  enableWheel: () => props.enableZoom,
  enableGlobalZoom: () => props.enableGlobalZoom,
  wheelZoomRatio: () => props.wheelZoomRatio,
  onDrag: (state) => {
    pan(state.delta)
  },
  onPinch: (state) => {
    // 双指缩放：以双指中心点为锚点
    const newScale = transform.value.scale * state.deltaScale
    zoomAt(newScale, state.center)
    zoom.value = newScale
  },
  onWheel: (state) => {
    // 滚轮缩放：以光标位置为锚点
    const newScale = transform.value.scale + state.delta
    zoomAt(newScale, state.center)
    zoom.value = newScale
  },
  onDoubleClick: (position) => {
    if (!props.enableDoubleClick)
      return
    toggleDoubleClickZoom()
    // 以双击位置为锚点
    zoomAt(zoom.value, position)
  },
})

// ===== 键盘事件 =====
useEventListener(
  () => (isOpen.value && props.enableKeyboard) ? window : null,
  'keydown',
  (event) => {
    if (event.key === 'Escape') {
      closePreview()
    }
  },
)

// ===== 缩略图样式 =====
const thumbnailContainerBaseStyle = computed<CSSProperties>(() => ({
  display: 'inline-block',
}))

const mergedThumbnailContainerStyle = computed<StyleValue>(() => [
  thumbnailContainerBaseStyle.value,
  props.containerStyle,
])

const thumbnailBaseStyle = computed<CSSProperties>(() => ({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  cursor: 'pointer',
  visibility: isOpen.value ? 'hidden' : 'visible',
}))

const thumbnailContainerClass = computed<HTMLAttributes['class']>(() => props.containerClass)

const thumbnailClass = computed<HTMLAttributes['class']>(() => props.thumbnailClass)

const mergedThumbnailStyle = computed<StyleValue>(() => [
  thumbnailBaseStyle.value,
  props.thumbnailStyle,
])

// ===== 遮罩样式 =====
const maskStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  inset: 0,
  backgroundColor: props.maskColor,
  zIndex: props.zIndex - 1,
  opacity: props.maskOpacity,
} as CSSProperties))

const maskDuration = computed(() => `${props.duration}ms`)

// ===== 预览图样式 =====
const previewContainerStyle = computed<CSSProperties>(() => ({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: props.zIndex,
  pointerEvents: 'none',
}))

const previewImageStyle = computed<CSSProperties>(() => ({
  maxWidth: '90vw',
  maxHeight: '90vh',
  objectFit: 'contain',
  cursor: isAnimating.value ? 'default' : isInteracting.value ? 'grabbing' : 'grab',
  transform: transformStyle.value,
  transformOrigin: 'center',
  willChange: isInteracting.value ? 'transform' : 'auto',
  pointerEvents: 'auto',
  userSelect: 'none',
  touchAction: 'none',
}))

// ===== 打开预览 =====
async function openPreview(): Promise<void> {
  if (isOpen.value || isAnimating.value)
    return

  // 重置状态
  resetTransform()
  resetZoom()
  loadState.value = 'loading'

  // 锁定滚动
  lockScroll()

  // 显示预览
  isMaskOpen.value = true
  isOpen.value = true

  // 等待 DOM 更新
  await nextTick()

  if (!thumbnailRef.value || !previewRef.value)
    return

  // 获取缩略图位置
  const thumbnailRect = thumbnailRef.value.getBoundingClientRect()
  // 获取预览图最终位置
  const previewRect = previewRef.value.getBoundingClientRect()

  // 执行 FLIP 动画
  await flip(thumbnailRect, previewRect, previewRef.value)
}

// ===== 关闭预览 =====
async function closePreview(): Promise<void> {
  if (!isOpen.value || isAnimating.value)
    return

  // 取消正在进行的动画
  cancelAnimation()

  isMaskOpen.value = false
  if (!thumbnailRef.value || !previewRef.value) {
    isOpen.value = false
    unlockScroll()
    return
  }

  // 1. 先保存当前的 transform 状态（在重置之前）
  const currentTransformSnapshot = {
    x: transform.value.x,
    y: transform.value.y,
    scale: transform.value.scale,
  }

  // 2. 重置变换状态（这样 Vue 的响应式样式会变为 translate(0,0)）
  resetTransform()

  // 3. 等待 DOM 更新，获取重置后的基准位置
  await nextTick()

  // 4. 获取重置后的预览图基准位置（没有拖拽偏移的居中位置）
  const previewRect = previewRef.value.getBoundingClientRect()
  // 获取缩略图位置
  const thumbnailRect = thumbnailRef.value.getBoundingClientRect()

  // 5. 执行反向 FLIP 动画，从当前实际位置（包含拖拽偏移）到缩略图位置
  await flipReverse(previewRect, thumbnailRect, previewRef.value, currentTransformSnapshot)

  // 关闭预览
  isOpen.value = false

  // 解锁滚动
  unlockScroll()
}

// ===== 处理遮罩点击 =====
function handleMaskClick(): void {
  if (props.closeOnMaskClick && !isAnimating.value) {
    closePreview()
  }
}

// ===== 处理图片加载 =====
function handleImageLoad(event: Event): void {
  loadState.value = 'loaded'
  emit('load', event)
}

function handleImageError(event: Event): void {
  loadState.value = 'error'
  emit('error', event)
}

// ===== 暴露方法和状态 =====
defineExpose({
  // 状态
  isOpen,
  isAnimating,
  zoom,
  transform,
  loadState,
  canZoomIn,
  canZoomOut,
  isInitialZoom,
  isDragging,
  isPinching,
  isWheeling,
  isInteracting,
  // 方法
  open: openPreview,
  close: closePreview,
  zoomIn,
  zoomOut,
  setZoom,
  resetZoom,
  resetTransform,
})
</script>

<template>
  <div :class="thumbnailContainerClass" :style="mergedThumbnailContainerStyle">
    <!-- 缩略图插槽 -->
    <slot name="thumbnail" :open="openPreview">
      <img
        ref="thumbnailRef"
        :src="src"
        :alt="alt"
        :class="thumbnailClass"
        :style="mergedThumbnailStyle"
        @click="openPreview"
      >
    </slot>
  </div>

  <!-- 遮罩层 -->
  <Teleport v-if="isMounted" to="body">
    <Transition name="hana-mask-fade">
      <div
        v-if="isMaskOpen"
        :style="maskStyle"
        @click="handleMaskClick"
      />
    </Transition>
  </Teleport>

  <!-- 预览图容器 -->
  <Teleport v-if="isMounted" to="body">
    <div
      v-if="isOpen"
      :style="previewContainerStyle"
    >
      <!-- 加载状态插槽 -->
      <slot v-if="loadState === 'loading'" name="loading">
        <div
          :style="{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '14px',
          }"
        >
          加载中...
        </div>
      </slot>

      <!-- 错误状态插槽 -->
      <slot v-else-if="loadState === 'error'" name="error">
        <div
          :style="{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '14px',
          }"
        >
          加载失败
        </div>
      </slot>

      <!-- 预览图片 -->
      <img
        ref="previewRef"
        :src="previewSrc || src"
        :alt="alt"
        :style="previewImageStyle"
        draggable="false"
        @load="handleImageLoad"
        @error="handleImageError"
      >

      <!-- 工具栏插槽 -->
      <slot
        name="toolbar"
        :zoom="zoom"
        :zoom-in="zoomIn"
        :zoom-out="zoomOut"
        :reset="resetZoom"
        :close="closePreview"
        :can-zoom-in="canZoomIn"
        :can-zoom-out="canZoomOut"
      />
    </div>
  </Teleport>
</template>

<style>
.hana-mask-fade-enter-active,
.hana-mask-fade-leave-active {
  transition: opacity v-bind('maskDuration') v-bind('props.easing');
}
.hana-mask-fade-enter-from,
.hana-mask-fade-leave-to {
  opacity: 0 !important;
}
.hana-mask-fade-enter-to,
.hana-mask-fade-leave-from {
  opacity: v-bind('props.maskOpacity') !important;
}
</style>
