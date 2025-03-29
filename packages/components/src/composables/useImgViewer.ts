import type { Ref } from 'vue'
import type { ImgViewerProps } from '../types'
import { ref, watch } from 'vue'
import { setStyles } from '../utils'
import useEventListeners from './useEventListeners'
import useTransformer from './useTransformer'

export default function useImgViewer(
  imgRef: Ref<HTMLImageElement | null>, // 图片 DOM
  props: ImgViewerProps,
) {
  const {
    maskBgColor,
    maskOpacity,
    previewZIndex,
    previewMaxWidth,
    previewMaxHeight,
    duration,
    dblClickZoom,
  } = props

  const displaying = ref(false) // 是否正在查看大图

  watch(displaying, (status) => {
    if (imgRef.value) {
      setStyles(imgRef.value, {
        visibility: status ? 'hidden' : 'visible',
      })
    }
  })

  const maskRef = ref<HTMLDivElement | null>(null) // 遮罩层 DOM
  const imgCopyRef = ref<HTMLImageElement | null>(null) // 大图 DOM

  // hook1 - 处理图片缩放
  const {
    handleWheel, // 绑 window
    handleTouchStart, // 绑 window
    handleDblclick, // 绑 imgCopyRef
    handleMouseDown, // 绑 imgCopyRef
    initTransformer,
  } = useTransformer(imgCopyRef, props)

  // 生成遮罩层
  const generateMask = (cb: () => void): void => {
    const mask = document.createElement('div')
    setStyles(mask, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: maskBgColor,
      opacity: '0',
      zIndex: `${previewZIndex - 1}`,
      transition: `all ${duration / 1000}s`,
    })

    document.body.appendChild(mask)

    requestAnimationFrame(() => {
      setStyles(mask, { opacity: String(maskOpacity) })
    })

    mask.onclick = cb
    maskRef.value = mask
  }

  // 生成新的大图
  const generateNewImg = (): void => {
    if (!imgRef.value)
      return

    const img = document.createElement('img')
    img.src = imgRef.value.src
    img.draggable = false

    const rect = imgRef.value.getBoundingClientRect()
    const imgAspectRatio = rect.width / rect.height
    const windowAspectRatio = window.innerWidth / window.innerHeight
    const scrollX = window.scrollX || document.documentElement.scrollLeft
    const scrollY = window.scrollY || document.documentElement.scrollTop

    setStyles(img, {
      position: 'absolute',
      width: imgAspectRatio > windowAspectRatio ? `${rect.width}px` : 'auto',
      height: imgAspectRatio > windowAspectRatio ? 'auto' : `${rect.height}px`,
      objectFit: 'cover',
      top: `${rect.top + scrollY}px`,
      left: `${rect.left + scrollX}px`,
      zIndex: `${previewZIndex}`,
      transition: `all ${duration / 1000}s`,
      cursor: 'grab',
    })

    document.body.appendChild(img)

    setTimeout(() => {
      setStyles(img, { transition: 'none' })
    }, duration)

    requestAnimationFrame(() => {
      setStyles(img, {
        width:
            imgAspectRatio > windowAspectRatio ? `${previewMaxWidth}` : 'auto',
        height:
            imgAspectRatio > windowAspectRatio ? 'auto' : `${previewMaxHeight}`,
        top: `calc(50vh + ${scrollY}px)`,
        left: '50%',
        transform: 'translate(-50%, -50%)',
      })
    })

    dblClickZoom && (img.ondblclick = handleDblclick)
    img.onmousedown = handleMouseDown

    imgCopyRef.value = img
  }

  // 清除所有生成的 DOM
  const clearDOM = () => {
    if (maskRef.value && imgCopyRef.value && imgRef.value) {
      setStyles(maskRef.value, { opacity: '0' })

      setStyles(imgCopyRef.value, {
        transition: `all ${duration / 1000}s`,
      })

      const rect = imgRef.value.getBoundingClientRect()
      const scrollX = window.scrollX || document.documentElement.scrollLeft
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const imgAspectRatio = rect.width / rect.height
      const windowAspectRatio = window.innerWidth / window.innerHeight

      requestAnimationFrame(() => {
        setStyles(imgCopyRef.value!, {
          transform: 'none',
          width:
              imgAspectRatio > windowAspectRatio ? `${rect.width}px` : 'auto',
          height:
              imgAspectRatio > windowAspectRatio ? 'auto' : `${rect.height}px`,
          top: `${rect.top + scrollY}px`,
          left: `${rect.left + scrollX}px`,
        })
      })

      setTimeout(() => {
        maskRef.value?.remove()
        imgCopyRef.value?.remove()
        maskRef.value = null
        imgCopyRef.value = null
        initTransformer()
      }, duration)
    }
  }

  // 监听键盘事件退出
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && displaying.value) {
      toggleDisplay()
    }
  }

  // hook2 - 处理事件监听
  const {
    toggleEventListener,
  } = useEventListeners({
    handleWheel,
    handleTouchStart,
    handleKeyDown,
  })

  // 切换查看大图状态
  function toggleDisplay() {
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
  function handleImgClick() {
    if (imgRef.value) {
      toggleDisplay()
      generateMask(toggleDisplay)
      generateNewImg()
    }
  }

  return {
    handleImgClick,
  }
}
