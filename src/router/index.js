import { createRouter, createWebHistory } from 'vue-router'
import * as NProgress from 'nprogress'
import POSCheckout from '@/views/checkout/index.vue'
import POSOrder from '@/views/order/index.vue'
import POSStart from '@/views/start/index.vue'
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
        component: POSOrder,
        meta: { title: 'POSfood Order', sidebar: 'Home' },
    },
    {
        path: '/pos/start',
        name: 'POSStart',
        component: POSStart,
        meta: { title: 'POSfood Start Order', sidebar: 'Home' },
    },
    {
        path: '/pos/checkout',
        name: 'POSCheckout',
        component: POSCheckout,
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
        meta: { title: 'POSfood Transactions', sidebar: 'History' },
    },
    {
        path: '/pos/menu',
        name: 'POSMenuManagement',
        component: () => import('@/views/menu-management/index.vue'),
        meta: { title: 'POSfood Menu Management', sidebar: 'Menu' },
    },
    {
        path: '/pos/reports',
        name: 'POSReporting',
        component: () => import('@/views/reporting/index.vue'),
        meta: { title: 'POSfood Reporting', sidebar: 'Reports' },
    },
    {
        path: '/pos/memberships',
        name: 'POSMemberships',
        component: () => import('@/views/memberships/index.vue'),
        meta: { title: 'POSfood Memberships', sidebar: 'Membership' },
    },
    {
        path: '/pos/vouchers',
        name: 'POSVouchers',
        component: () => import('@/views/vouchers/index.vue'),
        meta: { title: 'POSfood Vouchers', sidebar: 'Vouchers' },
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
router.beforeEach((to) => {
    NProgress.start()
    if (
        to.path !== '/' &&
        localStorage.getItem('posfood_session_locked') === '1'
    ) {
        return { path: '/', query: { locked: '1' } }
    }
})
router.afterEach(() => {
    NProgress.done()
})
router.onError(() => {
    NProgress.done()
})
export default router
export { mainRoutes }
