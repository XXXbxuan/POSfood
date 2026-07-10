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
