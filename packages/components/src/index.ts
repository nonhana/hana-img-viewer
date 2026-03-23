import type { App } from 'vue'
import HanaImgViewer from '@/components/HanaImgViewer.vue'

export { HanaImgViewer }

export {
  useDrag,
  useFLIP,
  useGesture,
  usePinch,
  useTransform,
  useWheel,
  useZoom,
} from './composables/core'

export {
  useControllable,
  useElementBounding,
  useEventListener,
  useScrollLock,
} from './composables/utils'

export { defaultProps } from './types'

export type { EmitsType } from './types/emits'

export type { PropsType } from './types/props'

export type {
  Bounds,
  Point,
  Size,
  Transform,
} from './types/utils'

// Register as a Vue global component
const components = [HanaImgViewer]

function install(app: App): void {
  components.forEach((component) => {
    app.component(component.name || 'HanaImgViewer', component)
  })
}

export default { install }
