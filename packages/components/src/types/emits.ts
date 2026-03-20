/**
 * 图片预览组件 Emits 类型
 */
export interface ImagePreviewEmits {
  /**
   * 打开/关闭状态变化
   */
  (e: 'update:open', value: boolean): void
  /**
   * 缩放变化
   */
  (e: 'update:zoom', value: number): void
  /**
   * 打开预览
   */
  (e: 'open'): void
  /**
   * 关闭预览
   */
  (e: 'close'): void
  /**
   * 缩放变化
   */
  (e: 'zoomChange', zoom: number): void
  /**
   * 图片加载成功
   */
  (e: 'load', event: Event): void
  /**
   * 图片加载失败
   */
  (e: 'error', event: Event): void
}
