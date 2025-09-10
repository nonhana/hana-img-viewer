import type { Ref } from 'vue'
import type { ImgViewerProps } from '../types'
import { computed, onUnmounted, ref, watchEffect } from 'vue'
import { getDistance, getTargetPosition, setStyles } from '../utils'

/**
 * 图片缩放器
 * @param targetRef - 目标元素的 ref，通常是预览图的 ref
 * @param props - 图片查看器组件的 props
 * @returns 图片缩放器 API
 */
export function useTransformer(
  targetRef: Ref<HTMLElement | null>,
  props: ImgViewerProps,
) {
  const { zoomStep, zoomMax, zoomMin, dblClickZoomTo, zoomFactorRad } = props

  const dragging = ref(false)
  const currentTranslateX = ref(0)
  const currentTranslateY = ref(0)
  const zoomLevel = ref(1)

  let initialDistance = 0
  let initialMouseX = 0
  let initialMouseY = 0
  let initialBoxX = 0
  let initialBoxY = 0

  watchEffect(() => {
    if (targetRef.value) {
      targetRef.value.style.cursor = dragging.value ? 'grabbing' : 'grab'
    }
  })

  const targetImgTransform = computed(() => {
    const translateX = currentTranslateX.value === 0
      ? '-50%'
      : `${currentTranslateX.value}px`

    const translateY = currentTranslateY.value === 0
      ? '-50%'
      : `${currentTranslateY.value}px`

    return `translate(${translateX}, ${translateY}) scale(${zoomLevel.value})`
  })

  const updateTransform = () => {
    if (!targetRef.value)
      return
    setStyles(targetRef.value, { transform: targetImgTransform.value })
  }

  const adjustZoom = (delta = 0, setTo?: number) => {
    if (setTo !== undefined) {
      zoomLevel.value = setTo
    }
    else {
      zoomLevel.value += delta
    }

    zoomLevel.value = Math.max(zoomMin, Math.min(zoomMax, zoomLevel.value))
    updateTransform()
  }

  /** 滚动时触发缩放 */
  const handleWheel = (event: WheelEvent) => {
    adjustZoom(event.deltaY < 0 ? zoomStep * zoomFactorRad : -zoomStep * zoomFactorRad)
  }

  /** 处理双击缩放行为 */
  const handleDblclick = () => {
    adjustZoom(0, zoomLevel.value > 1 ? 1 : dblClickZoomTo)
  }

  /** 处理在手机上的触摸行为 */
  const handleTouchMove = (e: TouchEvent) => {
    if (!targetRef.value)
      return

    if (e.touches.length === 2) {
      const [touch1, touch2] = [e.touches[0], e.touches[1]]
      const newDistance = getDistance(
        [touch1.pageX, touch1.pageY],
        [touch2.pageX, touch2.pageY],
      )
      const scaleChange = newDistance / initialDistance
      adjustZoom(0, zoomLevel.value * scaleChange)
      initialDistance = newDistance
    }
    else if (e.touches.length === 1) {
      const touch = e.touches[0]
      const deltaX = touch.pageX - initialMouseX
      const deltaY = touch.pageY - initialMouseY

      currentTranslateX.value = initialBoxX + deltaX
      currentTranslateY.value = initialBoxY + deltaY
      updateTransform()
    }
  }

  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (!targetRef.value)
      return

    if (e.touches.length === 2) {
      const [touch1, touch2] = [e.touches[0], e.touches[1]]
      initialDistance = getDistance(
        [touch1.pageX, touch1.pageY],
        [touch2.pageX, touch2.pageY],
      )
    }
    else if (e.touches.length === 1) {
      const touch = e.touches[0]
      initialMouseX = touch.pageX
      initialMouseY = touch.pageY
      const position = getTargetPosition(targetRef)
      initialBoxX = position[0]
      initialBoxY = position[1]
    }

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!targetRef.value)
      return

    const deltaX = e.clientX - initialMouseX
    const deltaY = e.clientY - initialMouseY

    currentTranslateX.value = initialBoxX + deltaX
    currentTranslateY.value = initialBoxY + deltaY
    updateTransform()
  }

  const handleMouseUp = () => {
    dragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (!targetRef.value)
      return

    dragging.value = true
    initialMouseX = e.clientX
    initialMouseY = e.clientY

    const position = getTargetPosition(targetRef)
    initialBoxX = position[0]
    initialBoxY = position[1]

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const initTransformer = () => {
    currentTranslateX.value = 0
    currentTranslateY.value = 0
    zoomLevel.value = 1
  }

  const cleanupListeners = () => {
    document.removeEventListener('wheel', handleWheel)
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  onUnmounted(cleanupListeners)

  return {
    handleWheel,
    handleTouchStart,
    handleDblclick,
    handleMouseDown,
    initTransformer,
    cleanupListeners,
  }
}
