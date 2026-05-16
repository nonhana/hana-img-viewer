import type { App } from 'vue'
import type { HanaImgViewerEmits, HanaImgViewerExposed, HanaImgViewerProps } from '@/types'
import HanaImgViewer from '@/components/HanaImgViewer.vue'
import '@/style.css'

export { HanaImgViewer }
export type {
  HanaImgViewerEmits,
  HanaImgViewerExposed,
  HanaImgViewerProps,
}

const components = [HanaImgViewer]

function install(app: App): void {
  for (const component of components) {
    app.component(component.name || 'HanaImgViewer', component)
  }
}

export default { install }
