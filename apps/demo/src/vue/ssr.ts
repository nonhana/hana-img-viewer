import { renderToString } from '@vue/server-renderer'
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import { createSSRApp } from 'vue'
import App from './App.vue'

export default () => {
  const app = createSSRApp(App)
  // element-plus SSR 要求提供稳定的 id/z-index provider，保证服务端与客户端一致
  app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
  return renderToString(app)
}
