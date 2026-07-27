import { createApp } from 'vue'
import VueKonva from 'vue-konva'
import App from './App.vue'
import router from './router'
import i18n from './system/language'
import { installShopAutoText } from './system/language/shopText.js'

import 'nprogress/nprogress.css'
import './assets/fonts/font-awesome/style.css'

import './assets/css/variables.css'
import './assets/css/base.css'
import './assets/css/layout.css'
import './assets/css/responsive.css'

import './assets/css/components/camera-scanner.css'
import './assets/css/components/product-menu.css'
import './assets/css/components/print-element.css'
import './assets/css/components/set-meal-customizer.css'
import './assets/css/components/qr-zoom-modal.css'
import './assets/css/components/sidebar.css'
import './assets/css/components/table-grid.css'
import './assets/css/components/table-layout-designer.css'
import './assets/css/components/table-layout-preview.css'
import './assets/css/components/sortable.css'
import './assets/css/components/thermal-receipt.css'
import './assets/css/components/tablet-keyboard.css'
import './assets/css/components/topbar.css'
import './assets/css/components/voucher-editor.css'
import './assets/css/components/voucher-print.css'

import './assets/css/pages/checkout.css'
import './assets/css/pages/login.css'
import './assets/css/pages/kitchen.css'
import './assets/css/pages/menu-management.css'
import './assets/css/pages/memberships.css'
import './assets/css/pages/order.css'
import './assets/css/pages/profile.css'
import './assets/css/pages/receipt.css'
import './assets/css/pages/reporting.css'
import './assets/css/pages/staff-management.css'
import './assets/css/pages/start.css'
import './assets/css/pages/transactions.css'
import './assets/css/pages/vouchers.css'

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(VueKonva)
app.mount('#app')
installShopAutoText()
