import { createRouter, createWebHistory } from 'vue-router'
import * as NProgress from 'nprogress'

export const mainRoutes = [
    {
        path: '/',
        name: 'POSDashboard',
        component: () => import('@/views/dashboard/index.vue'),
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
        component: () => import('@/views/order/start.vue'),
        meta: { title: 'POSfood Start Order' },
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
