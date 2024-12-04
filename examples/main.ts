import { createApp } from 'vue'
import App from './App.vue'
import HanaImgViewer from 'hana-img-viewer'

const app = createApp(App)

app.use(HanaImgViewer)

app.mount('#app')
