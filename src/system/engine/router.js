import { createRouter, createWebHistory } from 'vue-router'
import ShopLayout from '@/shoplayout/index.vue'
import * as NProgress from 'nprogress'

export const mainRoutes = [
    {
        path: '/',
        redirect: '/shop',
    },
    {
        path: '/shop',
        component: ShopLayout,
        meta: { title: 'Shop' },
        children: [
            {
                path: '',
                name: 'ShopHome',
                component: () => import('@/views/dashboard/index.vue'),
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/shop',
    },
]

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ left: 0, top: 0 })
            }, 50)
        })
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
