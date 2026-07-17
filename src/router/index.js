import { createRouter, createWebHistory } from 'vue-router'
import * as NProgress from 'nprogress'
const mainRoutes = [
    {
        path: '/',
        name: 'POSLogin',
        component: () => import('@/views/login/index.vue'),
        meta: { title: 'POSfood' },
    },
    {
        path: '/pos/order',
        name: 'POSOrder',
        component: () => import('@/views/order/index.vue'),
        meta: { title: 'POSfood Order' },
    },
    {
        path: '/pos/start',
        name: 'POSStart',
        component: () => import('@/views/start/index.vue'),
        meta: { title: 'POSfood Start Order' },
    },
    {
        path: '/pos/checkout',
        name: 'POSCheckout',
        component: () => import('@/views/checkout/index.vue'),
        meta: { title: 'POSfood Checkout' },
    },
    {
        path: '/pos/receipt/:id',
        name: 'POSReceipt',
        component: () => import('@/views/receipt/index.vue'),
        meta: { title: 'POSfood Receipt' },
    },
    {
        path: '/pos/transactions',
        name: 'POSTransactions',
        component: () => import('@/views/transactions/index.vue'),
        meta: { title: 'POSfood Transactions' },
    },
    {
        path: '/pos/menu',
        name: 'POSMenuManagement',
        component: () => import('@/views/menu-management/index.vue'),
        meta: { title: 'POSfood Menu Management' },
    },
    {
        path: '/pos/reports',
        name: 'POSReporting',
        component: () => import('@/views/reporting/index.vue'),
        meta: { title: 'POSfood Reporting' },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
]
const router = createRouter({
    history: createWebHistory(),
    scrollBehavior() {
        return { left: 0, top: 0 }
    },
    routes: mainRoutes,
})
router.beforeEach(() => {
    NProgress.start()
})
router.afterEach(() => {
    NProgress.done()
})
export default router
export { mainRoutes }
