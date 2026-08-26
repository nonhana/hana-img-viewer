import { createSSRApp } from 'vue'
import App from './App.vue'
import '../shared/theme.css'

const app = createSSRApp(App, { ssr: true })
app.mount('#app')
