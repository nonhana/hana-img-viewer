import type { App } from 'vue'
import HanaImgViewer from './components/HanaImgViewer.vue'

// ===== 组件导出 =====
export { HanaImgViewer }

// ===== Composables 导出（可选使用）=====
// 核心层 - 用于自定义图片预览逻辑
export {
  useDrag,
  useFLIP,
  useGesture,
  usePinch,
  useTransform,
  useWheel,
  useZoom,
} from './composables/core'

// 工具层 - 通用工具 composables
export {
  useControllable,
  useElementBounding,
  useEventListener,
  useScrollLock,
} from './composables/utils'

// ===== 类型导出 =====
// Props 默认值
export {
  imagePreviewPropsDefaults,
} from './types'

export type {
  // Emits 相关类型
  ImagePreviewEmits,
} from './types/emits'

export type {
  // Props 相关类型
  ImageLoadState,
  ImagePreviewProps,
} from './types/props'

export type {
  // 工具类型
  Bounds,
  MaybeRef,
  MaybeRefOrGetter,
  Point,
  Size,
  Transform,
} from './types/utils'

// ===== Vue 插件 =====
const components = [HanaImgViewer]

function install(app: App): void {
  components.forEach((component) => {
    app.component(component.name || 'HanaImgViewer', component)
  })
}

export default { install }
