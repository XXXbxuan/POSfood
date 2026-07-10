import { createApp } from 'vue'
import App from './App.vue'
import router from './system/engine/router.js'
import ElementPlus from 'element-plus'
import i18n from './system/language/index.js'
import Global from './system/store/global.js'
import PermmissionVue from './system/engine/permissionVue.js'
import BootstrapVue3 from 'bootstrap-vue-3'
import VueApexCharts from 'vue3-apexcharts'
import BootstrapVue3Wrappers from 'bootstrap-vue-3-wrappers'
import VueSocialSharing from 'vue-social-sharing'
import YoutubeIframe from '@techassi/vue-youtube-iframe'
import VueViewer from 'v-viewer'
import V3waterfall from 'v3-waterfall'
import { createMetaManager, defaultConfig, deepestResolver, plugin as vueMetaPlugin } from 'vue-meta'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import VueCountdown from '@chenfengyuan/vue-countdown'
import VueTelInput from 'vue3-tel-input'
import Vue3VideoPlayer from '@cloudgeek/vue3-video-player'

import 'element-plus/dist/index.css'
import 'nprogress/nprogress.css'
import './assets/css/animate.css'
import './assets/fonts/font-awesome/style.css'

import './system/engine/permission'

const app = createApp(App)

const globalOptions = {
    mode: 'auto',
}

window.onerror = function (message, source, lineno, colno, error) {
    document.body.innerHTML = `
        <pre style="white-space: pre-wrap; padding: 20px; color: red;">
${message}
${source}:${lineno}:${colno}
${error && error.stack ? error.stack : ''}
        </pre>
    `
}


app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.use(Global)
app.use(PermmissionVue)
app.use(BootstrapVue3)
app.use(BootstrapVue3Wrappers)
app.use(VueApexCharts)
app.use(VueSocialSharing)
app.use(YoutubeIframe)
app.use(V3waterfall)
app.use(createMetaManager(defaultConfig, deepestResolver))
app.use(vueMetaPlugin)
app.use(Vue3VideoPlayer)
app.use(VueViewer, {
    defaultOptions: {
        title: false,
        navbar: false,
        scalable: false,
        rotatable: false,
    },
})
app.use(VueTelInput, globalOptions)
app.component(VueQrcode.name, VueQrcode)
app.component(VueCountdown.name, VueCountdown)

app.mount('#app')
