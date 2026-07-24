import { createRouter, createWebHistory } from 'vue-router'
import * as NProgress from 'nprogress'
import POSCheckout from '@/views/checkout/index.vue'
import POSKitchen from '@/views/kitchen/component.js'
import POSOrder from '@/views/order/index.vue'
import POSStaffManagement from '@/views/staff-management/component.js'
import POSStart from '@/views/start/index.vue'
import {
    PERMISSIONS,
    hasPermission,
    normalizePermissionRole,
    readActiveAccount,
    roleHome,
} from '@/services/pos/permissions.js'
import { findStaffAccount } from '@/services/pos/staff.js'

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
        meta: {
            title: 'POSfood Order',
            sidebar: 'Home',
            permission: PERMISSIONS.CREATE_ORDER,
        },
    },
    {
        path: '/pos/start',
        name: 'POSStart',
        component: POSStart,
        meta: {
            title: 'POSfood Start Order',
            sidebar: 'Home',
            permission: PERMISSIONS.VIEW_POS,
        },
    },
    {
        path: '/pos/checkout',
        name: 'POSCheckout',
        component: POSCheckout,
        meta: {
            title: 'POSfood Checkout',
            sidebar: 'Home',
            permission: PERMISSIONS.CHECKOUT_ORDER,
        },
    },
    {
        path: '/pos/receipt/:id',
        name: 'POSReceipt',
        component: () => import('@/views/receipt/index.vue'),
        meta: {
            title: 'POSfood Receipt',
            sidebar: 'History',
            permission: PERMISSIONS.VIEW_TRANSACTIONS,
        },
    },
    {
        path: '/pos/transactions',
        name: 'POSTransactions',
        component: () => import('@/views/transactions/index.vue'),
        meta: {
            title: 'POSfood Transactions',
            sidebar: 'History',
            permission: PERMISSIONS.VIEW_TRANSACTIONS,
        },
    },
    {
        path: '/pos/menu',
        name: 'POSMenuManagement',
        component: () => import('@/views/menu-management/index.vue'),
        meta: {
            title: 'POSfood Menu Management',
            sidebar: 'Menu',
            permission: PERMISSIONS.MANAGE_MENU,
        },
    },
    {
        path: '/pos/reports',
        name: 'POSReporting',
        component: () => import('@/views/reporting/index.vue'),
        meta: {
            title: 'POSfood Reporting',
            sidebar: 'Reports',
            permission: PERMISSIONS.VIEW_REPORTS,
        },
    },
    {
        path: '/pos/memberships',
        name: 'POSMemberships',
        component: () => import('@/views/memberships/index.vue'),
        meta: {
            title: 'POSfood Memberships',
            sidebar: 'Membership',
            permission: PERMISSIONS.MANAGE_MEMBERS,
        },
    },
    {
        path: '/pos/vouchers',
        name: 'POSVouchers',
        component: () => import('@/views/vouchers/index.vue'),
        meta: {
            title: 'POSfood Vouchers',
            sidebar: 'Vouchers',
            permission: PERMISSIONS.MANAGE_VOUCHERS,
        },
    },
    {
        path: '/pos/staff',
        name: 'POSStaffManagement',
        component: POSStaffManagement,
        meta: {
            title: 'POSfood Staff Management',
            sidebar: 'Staff',
            permission: PERMISSIONS.MANAGE_STAFF,
        },
    },
    {
        path: '/pos/profile',
        name: 'POSStaffProfile',
        component: () => import('@/views/profile/index.vue'),
        meta: {
            title: 'POSfood My Profile',
            sidebar: 'Profile',
            allowAllStaff: true,
        },
    },
    {
        path: '/pos/kitchen',
        name: 'POSKitchen',
        component: POSKitchen,
        meta: {
            title: 'POSfood Kitchen',
            sidebar: 'Kitchen',
            permission: PERMISSIONS.VIEW_KITCHEN,
        },
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
    if (to.path === '/') return

    if (localStorage.getItem('posfood_session_locked') === '1') {
        return { path: '/', query: { locked: '1' } }
    }

    const activeAccount = readActiveAccount()
    const storedAccount = activeAccount?.employeeId
        ? findStaffAccount(activeAccount.employeeId)
        : null

    if (!activeAccount || !storedAccount || storedAccount.status !== 'active') {
        localStorage.removeItem('posfood_active_account')
        localStorage.removeItem('posfood_session_locked')
        return { path: '/', query: { auth: 'required' } }
    }

    const activeRole = normalizePermissionRole(storedAccount.role)
    if (to.meta.allowAllStaff) return
    if (!hasPermission(activeRole, to.meta.permission)) {
        return {
            path: roleHome(activeRole),
            query: { denied: to.fullPath },
        }
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
