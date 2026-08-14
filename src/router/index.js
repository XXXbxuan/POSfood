import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import { inventoryStore } from '@/services/inventoryStore'
import { PERMISSIONS } from '@/services/permissions'
import { t } from '@/system/language'

const routes = [
    {
        path: '/',
        name: 'login',
        component: () => import('@/views/login/index.vue'),
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
                component: () => import('@/views/home/index.vue'),
                meta: { title: 'Dashboard', nav: 'dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
            },
            {
                path: 'reports',
                name: 'reports',
                component: () => import('@/views/dashboard/index.vue'),
                meta: { title: 'Reports', nav: 'reports', permission: PERMISSIONS.VIEW_REPORTS },
            },
            {
                path: 'products',
                name: 'products',
                component: () => import('@/views/products/index.vue'),
                meta: { title: 'Products', nav: 'products', permission: PERMISSIONS.VIEW_PRODUCTS },
            },
            {
                path: 'warehouses',
                name: 'warehouses',
                component: () => import('@/views/warehouses/index.vue'),
                meta: { title: 'Warehouses', nav: 'warehouses', permission: PERMISSIONS.VIEW_WAREHOUSES },
            },
            {
                path: 'receive',
                name: 'receive',
                component: () => import('@/views/receive-stock/index.vue'),
                meta: { title: 'Receive Stock', nav: 'receive', permission: PERMISSIONS.RECEIVE_STOCK },
            },
            {
                path: 'internal-stock-in',
                name: 'internal-stock-in',
                redirect: { name: 'receive', query: { type: 'standard' } },
            },
            {
                path: 'stock-movement-requests',
                name: 'stock-movement-requests',
                component: () => import('@/views/stock-movement-requests/index.vue'),
                meta: { title: 'Supplier Stock In Requests', nav: 'supplier-requests', permission: PERMISSIONS.RECEIVE_STOCK },
            },
            {
                path: 'dispatch',
                name: 'dispatch',
                component: () => import('@/views/dispatch/index.vue'),
                meta: { title: 'Ship Items', nav: 'dispatch', permission: PERMISSIONS.ISSUE_STOCK },
            },
            {
                path: 'scan',
                name: 'scan',
                component: () => import('@/views/scan-product/index.vue'),
                meta: { title: 'Scan Product', nav: 'scan', permission: PERMISSIONS.VIEW_PRODUCTS },
            },
            {
                path: 'history',
                name: 'history',
                component: () => import('@/views/history/index.vue'),
                meta: { title: 'Stock History', nav: 'history', permission: PERMISSIONS.VIEW_STOCK_HISTORY },
            },
            {
                path: 'labels',
                name: 'labels',
                component: () => import('@/views/labels/index.vue'),
                meta: { title: 'Label Printing', nav: 'labels', permission: PERMISSIONS.PRINT_LABELS },
            },
            {
                path: 'staff',
                name: 'staff',
                component: () => import('@/views/staff/index.vue'),
                meta: { title: 'Staff Management', nav: 'staff', permission: PERMISSIONS.VIEW_STAFF },
            },
            {
                path: 'suppliers',
                name: 'suppliers',
                component: () => import('@/views/suppliers/index.vue'),
                meta: { title: 'Supplier Management', nav: 'suppliers', permission: PERMISSIONS.VIEW_SUPPLIERS },
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
    document.title = `${t(to.meta.title || 'Inventory')} · ${t('Inventory Management System')}`
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
    if (
        to.meta.permission &&
        inventoryStore.state.activeAccount &&
        !inventoryStore.can(to.meta.permission)
    ) {
        inventoryStore.addToast('You do not have access to that module.', 'danger')
        return '/inventory/dashboard'
    }
})

router.afterEach(() => NProgress.done())
router.onError(() => NProgress.done())

export default router
