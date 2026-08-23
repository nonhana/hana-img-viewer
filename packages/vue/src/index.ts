import type { App } from 'vue'
import type { HanaImgViewerProps } from './public-types'
import HanaImgViewer from './HanaImgViewer.vue'
import './style.css'

const installableHanaImgViewer = Object.assign(HanaImgViewer, {
  install(app: App) {
    app.component('HanaImgViewer', installableHanaImgViewer)
  },
})

export { installableHanaImgViewer as HanaImgViewer }
export type { HanaImgViewerProps }
export default installableHanaImgViewer
