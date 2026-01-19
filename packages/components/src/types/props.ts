import type { ExtractPropTypes, PropType } from 'vue'

/**
 * 图片预览组件 Props 默认值
 */
export const imagePreviewPropsDefaults = {
  // ===== 预览配置 =====
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  maskOpacity: 0.3,
  maskColor: '#000',
  zIndex: 9999,

  // ===== 缩放配置 =====
  minZoom: 0.5,
  maxZoom: 10,
  zoomStep: 0.5,
  doubleClickZoom: 2,
  wheelZoomRatio: 1,

  // ===== 功能开关 =====
  enableZoom: true,
  enableDrag: true,
  enablePinch: true,
  enableDoubleClick: true,
  enableKeyboard: true,
  closeOnMaskClick: true,
} as const

/**
 * 图片预览组件 Props 定义
 * 用于 defineProps
 */
export const imagePreviewPropsObj = {
  // ===== 图片相关 =====
  /**
   * 图片 URL（必需）
   */
  src: {
    type: String,
    required: true,
  },
  /**
   * 替代文本
   */
  alt: {
    type: String,
    default: '',
  },
  /**
   * 高分辨率预览图 URL（可选，默认使用 src）
   */
  previewSrc: {
    type: String,
    default: undefined,
  },
  /**
   * 缩略图宽度
   */
  width: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  /**
   * 缩略图高度
   */
  height: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },

  // ===== 预览配置 =====
  /**
   * 动画时长 (ms)
   */
  duration: {
    type: Number,
    default: imagePreviewPropsDefaults.duration,
  },
  /**
   * 动画缓动函数
   */
  easing: {
    type: String,
    default: imagePreviewPropsDefaults.easing,
  },
  /**
   * 遮罩透明度
   */
  maskOpacity: {
    type: Number,
    default: imagePreviewPropsDefaults.maskOpacity,
  },
  /**
   * 遮罩颜色
   */
  maskColor: {
    type: String,
    default: imagePreviewPropsDefaults.maskColor,
  },
  /**
   * 预览层 z-index
   */
  zIndex: {
    type: Number,
    default: imagePreviewPropsDefaults.zIndex,
  },

  // ===== 缩放配置 =====
  /**
   * 最小缩放
   */
  minZoom: {
    type: Number,
    default: imagePreviewPropsDefaults.minZoom,
  },
  /**
   * 最大缩放
   */
  maxZoom: {
    type: Number,
    default: imagePreviewPropsDefaults.maxZoom,
  },
  /**
   * 缩放步长
   */
  zoomStep: {
    type: Number,
    default: imagePreviewPropsDefaults.zoomStep,
  },
  /**
   * 双击缩放目标值
   */
  doubleClickZoom: {
    type: Number,
    default: imagePreviewPropsDefaults.doubleClickZoom,
  },
  /**
   * 滚轮缩放灵敏度
   */
  wheelZoomRatio: {
    type: Number,
    default: imagePreviewPropsDefaults.wheelZoomRatio,
  },

  // ===== 功能开关 =====
  /**
   * 启用缩放
   */
  enableZoom: {
    type: Boolean,
    default: imagePreviewPropsDefaults.enableZoom,
  },
  /**
   * 启用拖拽
   */
  enableDrag: {
    type: Boolean,
    default: imagePreviewPropsDefaults.enableDrag,
  },
  /**
   * 启用双指缩放
   */
  enablePinch: {
    type: Boolean,
    default: imagePreviewPropsDefaults.enablePinch,
  },
  /**
   * 启用双击缩放
   */
  enableDoubleClick: {
    type: Boolean,
    default: imagePreviewPropsDefaults.enableDoubleClick,
  },
  /**
   * 启用键盘控制
   */
  enableKeyboard: {
    type: Boolean,
    default: imagePreviewPropsDefaults.enableKeyboard,
  },
  /**
   * 点击遮罩关闭
   */
  closeOnMaskClick: {
    type: Boolean,
    default: imagePreviewPropsDefaults.closeOnMaskClick,
  },

  // ===== 双向绑定 =====
  /**
   * 是否打开（v-model:open）
   */
  open: {
    type: Boolean,
    default: undefined,
  },
  /**
   * 当前缩放（v-model:zoom）
   */
  zoom: {
    type: Number,
    default: undefined,
  },
} as const

/**
 * 图片预览组件 Props 类型
 */
export type ImagePreviewProps = ExtractPropTypes<typeof imagePreviewPropsObj>

/**
 * 图片加载状态
 */
export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error'
