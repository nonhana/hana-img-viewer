import type { HTMLAttributes, StyleValue } from 'vue'

/**
 * 图片预览组件 Props 类型
 */
export interface ImagePreviewProps {
  /**
   * 图片 URL（必需）
   */
  src: string
  /**
   * 替代文本
   */
  alt?: string
  /**
   * 高分辨率预览图 URL（可选，默认使用 `src`）
   */
  previewSrc?: string
  /**
   * 缩略图容器额外类名
   */
  containerClass?: HTMLAttributes['class']
  /**
   * 缩略图容器额外样式
   */
  containerStyle?: StyleValue
  /**
   * 缩略图额外类名
   */
  thumbnailClass?: HTMLAttributes['class']
  /**
   * 缩略图额外样式
   */
  thumbnailStyle?: StyleValue
  /**
   * 动画时长（ms）
   */
  duration?: number
  /**
   * 动画缓动函数
   */
  easing?: string
  /**
   * 遮罩透明度
   */
  maskOpacity?: number
  /**
   * 遮罩颜色
   */
  maskColor?: string
  /**
   * 预览层 z-index
   */
  zIndex?: number
  /**
   * 最小缩放
   */
  minZoom?: number
  /**
   * 最大缩放
   */
  maxZoom?: number
  /**
   * 缩放步长
   */
  zoomStep?: number
  /**
   * 双击缩放目标值
   */
  doubleClickZoom?: number
  /**
   * 滚轮缩放灵敏度
   */
  wheelZoomRatio?: number
  /**
   * 启用缩放
   */
  enableZoom?: boolean
  /**
   * 启用拖拽
   */
  enableDrag?: boolean
  /**
   * 启用双指缩放
   */
  enablePinch?: boolean
  /**
   * 启用全局缩放监听
   *
   * 开启后，预览打开时支持在图片元素外使用滚轮或双指继续缩放。
   */
  enableGlobalZoom?: boolean
  /**
   * 启用双击缩放
   */
  enableDoubleClick?: boolean
  /**
   * 启用键盘控制
   */
  enableKeyboard?: boolean
  /**
   * 点击遮罩关闭
   */
  closeOnMaskClick?: boolean
  /**
   * 是否打开（`v-model:open`）
   */
  open?: boolean
  /**
   * 当前缩放（`v-model:zoom`）
   */
  zoom?: number
}

type ImagePreviewDefaultProps = Required<Pick<ImagePreviewProps, | 'alt'
  | 'duration'
  | 'easing'
  | 'maskOpacity'
  | 'maskColor'
  | 'zIndex'
  | 'minZoom'
  | 'maxZoom'
  | 'zoomStep'
  | 'doubleClickZoom'
  | 'wheelZoomRatio'
  | 'enableZoom'
  | 'enableDrag'
  | 'enablePinch'
  | 'enableGlobalZoom'
  | 'enableDoubleClick'
  | 'enableKeyboard'
  | 'closeOnMaskClick'>>

/**
 * 图片预览组件 Props 默认值
 * 用于 `withDefaults()`
 */
export const imagePreviewPropsDefaults = {
  alt: '',
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  maskOpacity: 0.3,
  maskColor: '#000',
  zIndex: 9999,
  minZoom: 0.5,
  maxZoom: 10,
  zoomStep: 0.5,
  doubleClickZoom: 2,
  wheelZoomRatio: 1,
  enableZoom: true,
  enableDrag: true,
  enablePinch: true,
  enableGlobalZoom: true,
  enableDoubleClick: true,
  enableKeyboard: true,
  closeOnMaskClick: true,
} as const satisfies ImagePreviewDefaultProps

/**
 * 图片加载状态
 */
export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error'
