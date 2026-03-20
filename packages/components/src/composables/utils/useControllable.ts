import type { Ref, WritableComputedRef } from 'vue'
import { computed, ref } from 'vue'

/**
 * useControllable 选项
 */
export interface UseControllableOptions<T> {
  /**
   * 受控值 getter
   */
  prop: () => T
  /**
   * 受控模式判定 getter
   */
  isControlled?: () => boolean
  /**
   * 默认值（非受控模式下的初始值）
   */
  defaultValue: T
  /**
   * 值变化时的回调
   */
  onChange?: (value: T) => void
}

/**
 * 受控/非受控状态管理 composable
 *
 * - 当 isControlled() 为 false 时，使用内部状态（非受控模式）
 * - 当 isControlled() 为 true 时，使用外部状态（受控模式）
 * - 无论哪种模式，onChange 都会被调用
 *
 * @param options - 配置选项
 * @returns 可读写的 Ref<T>
 *
 * @example
 * ```ts
 * // 在组件中使用
 * const props = defineProps<{ open?: boolean }>()
 * const emit = defineEmits<{ 'update:open': [value: boolean] }>()
 *
 * const isOpen = useControllable({
 *   prop: () => props.open,
 *   defaultValue: false,
 *   onChange: v => emit('update:open', v),
 * })
 *
 * // 使用时无需关心是受控还是非受控
 * isOpen.value = true // 自动触发 onChange
 * ```
 */
export function useControllable<T>(
  options: UseControllableOptions<T>,
): WritableComputedRef<T> {
  const { prop, isControlled, defaultValue, onChange } = options

  // 内部状态（用于非受控模式）
  const internalValue = ref(defaultValue) as Ref<T>

  const getIsControlled = (): boolean => {
    if (isControlled) {
      return isControlled()
    }
    return prop() !== undefined
  }

  // 计算属性：自动判断使用受控值还是内部值
  const state = computed<T>({
    get() {
      if (getIsControlled()) {
        // 受控模式：使用外部值
        return prop()
      }
      // 非受控模式：使用内部值
      return internalValue.value
    },
    set(value: T) {
      if (getIsControlled()) {
        // 受控模式：只通知外部，不更新内部状态
        onChange?.(value)
      }
      else {
        // 非受控模式：更新内部状态并通知
        internalValue.value = value
        onChange?.(value)
      }
    },
  })

  return state
}
