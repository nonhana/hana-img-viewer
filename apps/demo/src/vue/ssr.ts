import { renderToString } from '@vue/server-renderer'
import { createSSRApp } from 'vue'
import App from './App.vue'

export default () => {
  const app = createSSRApp(App, { ssr: true })
  return renderToString(app)
}
