import { App } from 'vue'
import HanaImgViewer from './index.vue'

export { HanaImgViewer }

const components = [HanaImgViewer]

const install = (app: App) => {
  components.forEach((component) => {
    app.component(component.name ?? 'HanaImgViewer', component)
  })
}

export default { install }
