import type { Ref } from 'vue'
import type { ImgViewerProps } from '../types'
import { computed, onUnmounted, ref, watch } from 'vue'
import { getDistance, getTargetPosition, setStyles } from '../utils'

export function useTransformer(
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

  // 处理鼠标滚轮事件
  const handleWheel = (event: WheelEvent) => {
    if (targetRef.value) {
      zoomLevel.value += event.deltaY < 0 ? zoomStep : -zoomStep
      zoomLevel.value = Math.max(zoomMin, Math.min(zoomMax, zoomLevel.value))
      setStyles(targetRef.value, {
        transform: targetImgTransform.value,
      })
    }
  }

  // 处理双击事件
  const handleDblclick = () => {
    if (targetRef.value) {
      zoomLevel.value = zoomLevel.value > 1 ? 1 : dblClickZoomTo
      setStyles(targetRef.value, {
        transform: targetImgTransform.value,
      })
    }
  }

  // 处理触摸移动事件
  const handleTouchMove = (e: TouchEvent) => {
    if (!targetRef.value)
      return

    // 双指操作 - 缩放
    if (e.touches.length === 2) {
      const [touch1, touch2] = [e.touches[0], e.touches[1]]
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
    // 单指操作 - 拖动
    else if (e.touches.length === 1) {
      const touch = e.touches[0]
      const deltaX = touch.pageX - initialMouseX
      const deltaY = touch.pageY - initialMouseY

      currentTranslateX.value = initialBoxX + deltaX
      currentTranslateY.value = initialBoxY + deltaY
    }

    // 更新样式
    setStyles(targetRef.value, {
      transform: targetImgTransform.value,
    })
  }

  // 处理触摸结束事件
  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance = 0
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }

  // 处理触摸开始事件
  const handleTouchStart = (e: TouchEvent) => {
    if (!targetRef.value)
      return

    // 双指操作 - 缩放
    if (e.touches.length === 2) {
      const [touch1, touch2] = [e.touches[0], e.touches[1]]
      initialDistance = getDistance(
        [touch1.pageX, touch1.pageY],
        [touch2.pageX, touch2.pageY],
      )
    }
    // 单指操作 - 拖动
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

  // 处理鼠标移动事件
  const handleMouseMove = (e: MouseEvent) => {
    if (!targetRef.value)
      return

    const deltaX = e.clientX - initialMouseX
    const deltaY = e.clientY - initialMouseY

    currentTranslateX.value = initialBoxX + deltaX
    currentTranslateY.value = initialBoxY + deltaY

    // 更新样式
    setStyles(targetRef.value, {
      transform: targetImgTransform.value,
    })
  }

  // 处理鼠标抬起事件
  const handleMouseUp = () => {
    dragging.value = false
    // 移除事件监听
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // 处理鼠标按下事件
  const handleMouseDown = (e: MouseEvent) => {
    if (!targetRef.value)
      return

    dragging.value = true
    initialMouseX = e.clientX
    initialMouseY = e.clientY

    const position = getTargetPosition(targetRef)
    initialBoxX = position[0]
    initialBoxY = position[1]

    // 添加事件监听
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const initTransformer = () => {
    currentTranslateX.value = 0
    currentTranslateY.value = 0
    zoomLevel.value = 1
  }

  // 需要在其他处理函数定义完成后，再定义清理函数
  // 清理所有事件监听
  const cleanupListeners = () => {
    document.removeEventListener('wheel', handleWheel)
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cleanupListeners()
  })

  return {
    handleWheel, // 绑 window
    handleTouchStart, // 绑 window
    handleDblclick, // 绑 imgCopyRef
    handleMouseDown, // 绑 imgCopyRef
    initTransformer,
    cleanupListeners, // 导出清理函数
  }
}
