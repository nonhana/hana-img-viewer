import { createApp } from 'vue'
import App from './App.vue'
import '../shared/app.css'

const app = createApp(App, { ssr: false })

app.mount('#app')
