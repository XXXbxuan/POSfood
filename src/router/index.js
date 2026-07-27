import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import { inventoryStore } from '@/services/inventoryStore'

const routes = [
    {
        path: '/',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: 'Staff Login' },
    },
    {
        path: '/inventory',
        component: () => import('@/layouts/InventoryLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/inventory/dashboard',
            },
            {
                path: 'dashboard',
                name: 'dashboard',
                component: () => import('@/views/DashboardView.vue'),
                meta: { title: 'Dashboard', nav: 'dashboard' },
            },
            {
                path: 'products',
                name: 'products',
                component: () => import('@/views/ProductsView.vue'),
                meta: { title: 'Products', nav: 'products' },
            },
            {
                path: 'receive',
                name: 'receive',
                component: () => import('@/views/ReceiveStockView.vue'),
                meta: { title: 'Receive Stock', nav: 'receive' },
            },
            {
                path: 'scan',
                name: 'scan',
                component: () => import('@/views/ScanProductView.vue'),
                meta: { title: 'Scan Product', nav: 'scan' },
            },
            {
                path: 'history',
                name: 'history',
                component: () => import('@/views/HistoryView.vue'),
                meta: { title: 'Stock History', nav: 'history' },
            },
            {
                path: 'labels',
                name: 'labels',
                component: () => import('@/views/LabelsView.vue'),
                meta: { title: 'Label Printing', nav: 'labels' },
            },
        ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
})

router.beforeEach((to) => {
    NProgress.start()
    document.title = `${to.meta.title || 'Inventory'} · Inventory Management System`
    if (
        to.meta.requiresAuth &&
        (!inventoryStore.state.activeAccount ||
            inventoryStore.state.sessionLocked)
    ) {
        return {
            path: '/',
            query: inventoryStore.state.sessionLocked ? { locked: '1' } : {},
        }
    }
    if (to.name === 'login' && inventoryStore.state.activeAccount && !inventoryStore.state.sessionLocked)
        return '/inventory/dashboard'
})

router.afterEach(() => NProgress.done())
router.onError(() => NProgress.done())

export default router
