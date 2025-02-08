import HanaImgViewer from 'hana-img-viewer'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.use(HanaImgViewer)

app.mount('#app')
