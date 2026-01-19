/**
 * 图片预览组件 Emits 定义
 * 用于 defineEmits
 */
export const imagePreviewEmitsObj = {
  /**
   * 打开/关闭状态变化
   */
  'update:open': (value: boolean) => typeof value === 'boolean',
  /**
   * 缩放变化
   */
  'update:zoom': (value: number) => typeof value === 'number',
  /**
   * 打开预览
   */
  'open': () => true,
  /**
   * 关闭预览
   */
  'close': () => true,
  /**
   * 缩放变化
   */
  'zoomChange': (zoom: number) => typeof zoom === 'number',
  /**
   * 图片加载成功
   */
  'load': (event: Event) => event instanceof Event,
  /**
   * 图片加载失败
   */
  'error': (event: Event) => event instanceof Event,
} as const

/**
 * 图片预览组件 Emits 类型
 */
export type ImagePreviewEmits = typeof imagePreviewEmitsObj
