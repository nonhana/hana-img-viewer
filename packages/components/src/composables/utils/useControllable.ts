import type { Ref, WritableComputedRef } from 'vue'
import { computed, ref } from 'vue'

/**
 * useControllable 选项
 */
export interface UseControllableOptions<T> {
  /**
   * 获取受控值的函数（通常是 () => props.xxx）
   * 返回 undefined 表示非受控模式
   */
  prop: () => T | undefined
  /**
   * 默认值（非受控模式下的初始值）
   */
  defaultValue: T
  /**
   * 值变化时的回调（通常用于触发 emit）
   */
  onChange?: (value: T) => void
}

/**
 * 受控/非受控状态管理 composable
 *
 * 实现类似 React 的受控组件模式：
 * - 当 prop() 返回 undefined 时，使用内部状态（非受控模式）
 * - 当 prop() 返回有效值时，使用外部状态（受控模式）
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
  const { prop, defaultValue, onChange } = options

  // 内部状态（用于非受控模式）
  const internalValue = ref(defaultValue) as Ref<T>

  // 计算属性：自动判断使用受控值还是内部值
  const state = computed<T>({
    get() {
      const controlled = prop()
      // 受控模式：使用外部值
      if (controlled !== undefined) {
        return controlled
      }
      // 非受控模式：使用内部值
      return internalValue.value
    },
    set(value: T) {
      const controlled = prop()

      if (controlled !== undefined) {
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

/**
 * 使用 v-model 的简化版本
 *
 * 专门为 Vue 的 v-model 设计，自动处理 `update:xxx` 事件
 *
 * @param props - 组件 props
 * @param key - prop 键名
 * @param emit - emit 函数
 * @param defaultValue - 默认值
 * @returns 可读写的 Ref
 *
 * @example
 * ```ts
 * const props = defineProps<{ modelValue?: string }>()
 * const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
 *
 * const value = useVModel(props, 'modelValue', emit, '')
 * ```
 */
export function useVModel<
  P extends Record<string, unknown>,
  K extends keyof P,
  E extends (event: `update:${K & string}`, value: P[K]) => void,
>(
  props: P,
  key: K,
  emit: E,
  defaultValue: NonNullable<P[K]>,
): WritableComputedRef<NonNullable<P[K]>> {
  return useControllable({
    prop: () => props[key] as NonNullable<P[K]> | undefined,
    defaultValue,
    onChange: value => emit(`update:${key as string}` as `update:${K & string}`, value as P[K]),
  }) as WritableComputedRef<NonNullable<P[K]>>
}
