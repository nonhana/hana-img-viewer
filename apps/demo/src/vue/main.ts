import { createApp } from 'vue'
import App from './App.vue'
import '../shared/theme.css'

const app = createApp(App, { ssr: false })

app.mount('#app')
