import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)
// 与服务端渲染使用相同的 provider，保证 hydration 时 id/z-index 一致
app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
app.mount('#app')
