import type { Ref } from 'vue'
import type { ImgViewerProps } from '../types'
import { computed, ref, watch } from 'vue'
import { getDistance, getTargetPosition, setStyles } from '../utils'

export default function useTransformer(
  targetRef: Ref<HTMLElement | null>,
  props: ImgViewerProps,
) {
  const { zoomStep, zoomMax, zoomMin, dblClickZoomTo } = props

  const dragging = ref(false) // 是否正在拖动大图

  watch(dragging, (newV) => {
    if (targetRef.value) {
      targetRef.value.style.cursor = newV ? 'grabbing' : 'grab'
    }
  })

  let initialDistance = 0 // 缩放时，初始两指距离

  let initialMouseX = 0 // 按下鼠标时，鼠标的初始位置 X
  let initialMouseY = 0 // 按下鼠标时，鼠标的初始位置 Y
  let initialBoxX = 0 // 初始大图的 transform X 偏移
  let initialBoxY = 0 // 初始大图的 transform Y 偏移

  const currentTranslateX = ref(0) // 当前大图的 transform X 偏移
  const currentTranslateY = ref(0) // 当前大图的 transform Y 偏移

  const zoomLevel = ref(1) // 缩放级别，初始为 1

  const targetImgTransform = computed(() => {
    const translateX = currentTranslateX.value === 0
      ? '-50%'
      : `${currentTranslateX.value}px`

    const translateY = currentTranslateY.value === 0
      ? '-50%'
      : `${currentTranslateY.value}px`

    return `translate(${translateX}, ${translateY}) scale(${zoomLevel.value})`
  })

  const handleWheel = (event: WheelEvent) => {
    if (targetRef.value) {
      zoomLevel.value += event.deltaY < 0 ? zoomStep : -zoomStep
      zoomLevel.value = Math.max(zoomMin, Math.min(zoomMax, zoomLevel.value))
      setStyles(targetRef.value, {
        transform: targetImgTransform.value,
      })
    }
  }

  const handleDblclick = () => {
    if (targetRef.value) {
      zoomLevel.value = zoomLevel.value > 1 ? 1 : dblClickZoomTo
      setStyles(targetRef.value, {
        transform: targetImgTransform.value,
      })
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (targetRef.value) {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const newDistance = getDistance(
          [touch1.pageX, touch1.pageY],
          [touch2.pageX, touch2.pageY],
        )
        const scaleChange = newDistance / initialDistance
        zoomLevel.value = Math.max(
          zoomMin,
          Math.min(zoomMax, zoomLevel.value * scaleChange),
        )
        initialDistance = newDistance
      }
      else if (e.touches.length === 1) {
        const touch = e.touches[0]
        const deltaX = touch.pageX - initialMouseX
        const deltaY = touch.pageY - initialMouseY

        currentTranslateX.value = initialBoxX + deltaX
        currentTranslateY.value = initialBoxY + deltaY
      }

      setStyles(targetRef.value, {
        transform: targetImgTransform.value,
      })
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance = 0
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (targetRef.value) {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        initialDistance = getDistance(
          [touch1.pageX, touch1.pageY],
          [touch2.pageX, touch2.pageY],
        )
      }
      else if (e.touches.length === 1) {
        const touch = e.touches[0]
        initialMouseX = touch.pageX
        initialMouseY = touch.pageY
        ;[initialBoxX, initialBoxY] = getTargetPosition(targetRef)
      }

      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (targetRef.value) {
      const deltaX = e.clientX - initialMouseX
      const deltaY = e.clientY - initialMouseY

      currentTranslateX.value = initialBoxX + deltaX
      currentTranslateY.value = initialBoxY + deltaY

      setStyles(targetRef.value, {
        transform: targetImgTransform.value,
      })
    }
  }

  const handleMouseUp = () => {
    dragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (targetRef.value) {
      dragging.value = true
      initialMouseX = e.clientX
      initialMouseY = e.clientY
      ;[initialBoxX, initialBoxY] = getTargetPosition(targetRef)

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  const initTransformer = () => {
    currentTranslateX.value = 0
    currentTranslateY.value = 0
    zoomLevel.value = 1
  }

  return {
    handleWheel, // 绑 window
    handleTouchStart, // 绑 window
    handleDblclick, // 绑 imgCopyRef
    handleMouseDown, // 绑 imgCopyRef
    initTransformer,
  }
}
