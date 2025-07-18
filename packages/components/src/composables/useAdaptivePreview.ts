import type { Ref } from 'vue'
import type { ImgViewerProps } from '../types'
import { computed, ref, watch } from 'vue'
import { getHighestZIndex, isInModalContainer } from '../utils'

interface UseAdaptivePreviewOptions {
  imgRef: Ref<HTMLImageElement | null>
  props: ImgViewerProps
}

/**
 * 自适应预览功能
 * 自动处理 z-index 层级和位置计算
 */
export function useAdaptivePreview(options: UseAdaptivePreviewOptions) {
  const { imgRef, props } = options

  const computedZIndex = ref(props.previewZIndex)
  const isInModal = ref(false)

  // 动态计算 z-index
  const finalZIndex = computed(() => {
    if (!props.autoZIndex) {
      return props.previewZIndex
    }

    return computedZIndex.value
  })

  // 检测容器类型并调整 z-index
  const updateZIndex = () => {
    if (!props.autoZIndex || !imgRef.value) {
      return
    }

    // 检测是否在模态容器中
    isInModal.value = isInModalContainer(imgRef.value)

    if (isInModal.value) {
      // 如果在模态容器中，获取更高的 z-index
      const highestZIndex = getHighestZIndex(imgRef.value)
      computedZIndex.value = Math.max(highestZIndex, props.previewZIndex)
    }
    else {
      // 如果不在模态容器中，使用默认值
      computedZIndex.value = props.previewZIndex
    }
  }

  // 监听 imgRef 变化
  watch(imgRef, () => {
    updateZIndex()
  }, { immediate: true })

  // 监听 props 变化
  watch(() => [props.autoZIndex, props.previewZIndex], () => {
    updateZIndex()
  })

  return {
    finalZIndex,
    isInModal,
    updateZIndex,
  }
}
