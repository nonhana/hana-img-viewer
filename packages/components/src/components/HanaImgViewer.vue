<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onMounted, ref } from 'vue'
import useImgViewer from '../composables/useImgViewer'
import { imgViewerPropsObj } from '../types'

defineOptions({ name: 'HanaImgViewer' })

const props = defineProps(imgViewerPropsObj)

const imgStyle = computed<CSSProperties>(() => ({
  width: (typeof props.width === 'number' ? `${props.width}px` : props.width) ?? 'fit-content',
  height: (typeof props.height === 'number' ? `${props.height}px` : props.height) ?? 'fit-content',
}))

const imgRef = ref<HTMLImageElement | null>(null)

const handleClick = ref<() => void>()

onMounted(() => {
  if (imgRef.value) {
    const { handleImgClick } = useImgViewer(imgRef, props)
    handleClick.value = handleImgClick
  }
})
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
    <div :style="imgStyle">
      <img
        ref="imgRef"
        :src="src"
        :alt="alt"
        style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
        @click="handleClick"
      >
    </div>
    <span v-if="alt" style="font-size: 0.8rem; color: #666;">{{ alt }}</span>
  </div>
</template>
