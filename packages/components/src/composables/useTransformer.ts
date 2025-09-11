import type { Ref } from 'vue'
import type { ImgViewerProps } from '../types'
import { computed, onUnmounted, ref, watchEffect } from 'vue'
import { getDistance, setStyles } from '../utils'

/**
 * 图片缩放器
 * @param targetRef - 预览图 ref
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
    const translateX = `calc(-50% + ${currentTranslateX.value}px)`
    const translateY = `calc(-50% + ${currentTranslateY.value}px)`
    return `translate(${translateX}, ${translateY}) scale(${zoomLevel.value})`
  })

  const updateTransform = () => {
    if (!targetRef.value)
      return
    setStyles(targetRef.value, { transform: targetImgTransform.value })
  }

  /** 在光标位置进行缩放 */
  const zoomAtPoint = (targetZoom: number, clientX: number, clientY: number) => {
    if (!targetRef.value)
      return

    const oldZoom = zoomLevel.value
    const newZoom = Math.max(zoomMin, Math.min(zoomMax, targetZoom))
    if (newZoom === oldZoom)
      return

    const rect = targetRef.value.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const ratio = newZoom / oldZoom
    const deltaCenterX = (clientX - centerX) * (1 - ratio)
    const deltaCenterY = (clientY - centerY) * (1 - ratio)

    currentTranslateX.value += deltaCenterX
    currentTranslateY.value += deltaCenterY
    zoomLevel.value = newZoom
    updateTransform()
  }

  const adjustZoom = ({
    delta = 0,
    setTo,
    clientX,
    clientY,
  }: {
    delta?: number
    setTo?: number
    clientX?: number
    clientY?: number
  }) => {
    if (!targetRef.value)
      return

    const oldZoom = zoomLevel.value
    const targetZoom = setTo !== undefined ? setTo : oldZoom + delta

    // 默认以图片中心为锚点进行缩放
    const rect = targetRef.value.getBoundingClientRect()
    const fallbackX = rect.left + rect.width / 2
    const fallbackY = rect.top + rect.height / 2

    zoomAtPoint(targetZoom, clientX ?? fallbackX, clientY ?? fallbackY)
  }

  let wheelingTimeout: NodeJS.Timeout
  let isTrackPad = false
  const wheelingDebounce = 150 // 150ms 内没有新的 wheel 事件，则重置 isTrackPad = 30

  const handleWheel = (e: WheelEvent) => {
    clearTimeout(wheelingTimeout)

    wheelingTimeout = setTimeout(() => {
      isTrackPad = false
    }, wheelingDebounce)

    // 判断是否是触摸板：deltaY 有小数部分 或 deltaY 绝对值很小
    if (Math.abs(e.deltaY) % 1 !== 0 || Math.abs(e.deltaY) < 30) {
      isTrackPad = true
    }

    const delta = isTrackPad
      ? e.deltaY < 0 ? zoomStep * zoomFactorRad / 10 : -zoomStep * zoomFactorRad / 10
      : e.deltaY < 0 ? zoomStep * zoomFactorRad : -zoomStep * zoomFactorRad
    adjustZoom({ delta, clientX: e.clientX, clientY: e.clientY })
  }

  const handleDblclick = () => {
    const nextZoom = zoomLevel.value > 1 ? 1 : dblClickZoomTo
    if (nextZoom === 1) {
      zoomLevel.value = 1
      updateTransform()
      return
    }
    adjustZoom({ setTo: nextZoom })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!targetRef.value)
      return

    if (e.touches.length === 2) {
      const [touch1, touch2] = [e.touches[0], e.touches[1]]
      const newDistance = getDistance(
        [touch1.pageX, touch1.pageY],
        [touch2.pageX, touch2.pageY],
      )
      const midX = (touch1.pageX + touch2.pageX) / 2
      const midY = (touch1.pageY + touch2.pageY) / 2
      const scaleChange = newDistance / initialDistance
      const targetZoom = zoomLevel.value * scaleChange
      adjustZoom({ setTo: targetZoom, clientX: midX, clientY: midY })
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
      initialBoxX = currentTranslateX.value
      initialBoxY = currentTranslateY.value
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

    initialBoxX = currentTranslateX.value
    initialBoxY = currentTranslateY.value

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
