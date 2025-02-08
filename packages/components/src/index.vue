<script lang="ts">
import type { CSSProperties } from 'vue'
import { computed, defineComponent, ref } from 'vue'
import useImgViewer from './composables/useImgViewer'
import { imgViewerPropsObj } from './type'
import { preventDefault } from './utils'

export default defineComponent({
  name: 'HanaImgViewer',
  props: imgViewerPropsObj,
  setup(props) {
    const imgStyle = computed<CSSProperties>(() => ({
      width:
        (typeof props.width === 'number' ? `${props.width}px` : props.width)
        ?? 'fit-content',
      height:
        (typeof props.height === 'number'
          ? `${props.height}px`
          : props.height) ?? 'fit-content',
    }))

    const displaying = ref(false) // 是否正在查看大图
    const imgRef = ref<HTMLImageElement | null>(null) // 原图片 DOM

    const {
      generateMask,
      generateNewImg,
      handleWheel,
      handleTouchStart,
      clearDOM,
    } = useImgViewer(imgRef, props)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && displaying.value) {
        // eslint-disable-next-line ts/no-use-before-define
        toggleDisplay()
      }
    }

    const toggleEventListener = (type: 'on' | 'off') => {
      switch (type) {
        case 'on':
          window.addEventListener('wheel', preventDefault, {
            passive: false,
          })
          window.addEventListener('touchmove', preventDefault, {
            passive: false,
          })
          window.addEventListener('wheel', handleWheel)
          window.addEventListener('touchstart', handleTouchStart)
          window.addEventListener('keydown', handleKeyDown)
          break
        case 'off':
          window.removeEventListener('wheel', preventDefault)
          window.removeEventListener('wheel', handleWheel)
          window.removeEventListener('touchmove', preventDefault)
          window.removeEventListener('touchstart', handleTouchStart)
          window.removeEventListener('keydown', handleKeyDown)
          break
        default:
          break
      }
    }

    // 切换查看大图状态
    const toggleDisplay = () => {
      if (displaying.value) {
        clearDOM()
        setTimeout(() => {
          displaying.value = false
          document.body.style.overflow = 'auto'
          toggleEventListener('off')
        }, props.duration)
      }
      else {
        displaying.value = true
        document.body.style.overflow = 'hidden'
        toggleEventListener('on')
      }
    }

    // 点击原图片
    const handleClick = () => {
      if (imgRef.value) {
        toggleDisplay()
        generateMask(toggleDisplay)
        generateNewImg()
      }
    }

    return {
      imgStyle,
      displaying,
      imgRef,
      toggleDisplay,
      handleClick,
    }
  },
})
</script>

<template>
  <div class="img-viewer">
    <div :style="imgStyle">
      <img
        ref="imgRef"
        class="img-viewer__image"
        :src="src"
        :alt="alt"
        :style="{ visibility: displaying ? 'hidden' : 'visible' }"
        @click="handleClick"
      >
    </div>
    <span v-if="alt" class="img-viewer__alt">{{ alt }}</span>
  </div>
</template>

<style scoped lang="scss">
.img-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }

  &__alt {
    font-size: 0.8rem;
    color: #666;
  }
}
</style>
