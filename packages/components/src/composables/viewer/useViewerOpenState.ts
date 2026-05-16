import { computed, ref } from 'vue'

export interface UseViewerOpenStateOptions {
  open: () => boolean | undefined
  isControlled: () => boolean
  onOpenChange: (value: boolean) => void
}

export function useViewerOpenState(options: UseViewerOpenStateOptions) {
  const internalOpen = ref(false)

  const isOpen = computed({
    get() {
      if (options.isControlled())
        return Boolean(options.open())
      return internalOpen.value
    },
    set(value: boolean) {
      if (!options.isControlled()) {
        internalOpen.value = value
        options.onOpenChange(value)
        return
      }

      if (Boolean(options.open()) !== value) {
        options.onOpenChange(value)
      }
    },
  })

  return {
    isOpen,
  }
}
