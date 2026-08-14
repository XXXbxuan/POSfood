import { createApp } from 'vue'
import App from './App.vue'
import ScrollableSelect from './components/common/ScrollableSelect.vue'
import router from './router'
import { inventoryStore } from './services/inventoryStore'
import language, { registerLocalizedEntities } from './system/language'
import { installAutoText } from './system/language/autoText'

import 'nprogress/nprogress.css'
import './assets/fonts/font-awesome/style.css'
import './assets/css/variables.css'
import './assets/css/base.css'
import './assets/css/layout.css'
import './assets/css/components/forms.css'
import './assets/css/components/modal.css'
import './assets/css/components/table.css'
import './assets/css/responsive.css'

inventoryStore.initialize()
registerLocalizedEntities(inventoryStore.state)

const app = createApp(App)
app.component('ScrollableSelect', ScrollableSelect)
app.use(router)
app.use(language)
app.mount('#app')
installAutoText()
