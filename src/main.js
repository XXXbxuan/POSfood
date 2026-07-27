import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { inventoryStore } from './services/inventoryStore'

import 'nprogress/nprogress.css'
import './assets/fonts/font-awesome/style.css'
import './assets/css/app.css'

inventoryStore.initialize()

createApp(App).use(router).mount('#app')
