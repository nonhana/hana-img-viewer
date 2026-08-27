import { createSSRApp } from 'vue'
import App from './App.vue'
import '../shared/app.css'

const app = createSSRApp(App, { ssr: true })
app.mount('#app')
