import type { App } from 'vue'
import HanaImgViewer from './components/HanaImgViewer.vue'

export { HanaImgViewer }

export * from './types'

const components = [HanaImgViewer]

function install(app: App): void {
  components.forEach((component) => {
    app.component(component.name || 'HanaImgViewer', component)
  })
}

export default { install }
