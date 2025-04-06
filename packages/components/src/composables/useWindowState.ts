import { onMounted, onUnmounted, ref } from 'vue'

export function useWindowState() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 0)
  const scrollX = ref(typeof window !== 'undefined' ? window.scrollX : 0)
  const scrollY = ref(typeof window !== 'undefined' ? window.scrollY : 0)

  const updateSize = () => {
    if (typeof window === 'undefined')
      return
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  const updateScroll = () => {
    if (typeof window === 'undefined')
      return
    scrollX.value = window.scrollX || window.pageXOffset
    scrollY.value = window.scrollY || window.pageYOffset
  }

  onMounted(() => {
    updateSize()
    updateScroll()

    window.addEventListener('resize', updateSize, { passive: true })
    window.addEventListener('scroll', updateScroll, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined')
      return
    window.removeEventListener('resize', updateSize)
    window.removeEventListener('scroll', updateScroll)
  })

  return {
    width,
    height,
    scrollX,
    scrollY,
  }
}
