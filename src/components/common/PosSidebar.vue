<template>
    <div class="sidebar-controller">
        <button
            v-if="!isOpen"
            type="button"
            class="sidebar-handle"
            aria-label="Open navigation"
            @click="isOpen = true"
        >
            <i class="fa-solid fa-chevron-right"></i>
        </button>
        <button
            v-if="isOpen"
            type="button"
            class="sidebar-scrim"
            aria-label="Close navigation"
            @click="isOpen = false"
        ></button>
        <aside class="app-sidebar pos-sidebar" :class="{ open: isOpen }">
            <button type="button" class="sidebar-brand" @click="goHome">
                Restro <span>POS</span>
            </button>
            <nav>
                <button
                    v-for="item in items"
                    :key="item.label"
                    type="button"
                    :class="{ active: active === item.label }"
                    @click="navigate(item)"
                >
                    <i class="fa-solid" :class="item.icon"></i
                    ><span>{{ item.label }}</span>
                </button>
            </nav>
            <div class="sidebar-spacer"></div>
            <div class="profile-card">
                <div class="avatar">{{ initials }}</div>
                <div>
                    <strong>Profile</strong><small>{{ accountName }}</small>
                </div>
            </div>
            <button type="button" class="logout-button" @click="logout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i
                ><span>Logout</span>
            </button>
        </aside>
    </div>
</template>
<script>
export default {
    name: 'PosSidebar',
    props: { active: { type: String, default: '' } },
    data() {
        return {
            isOpen: false,
            items: [
                { label: 'Home', icon: 'fa-house', route: '/pos/start' },
                {
                    label: 'History',
                    icon: 'fa-clock-rotate-left',
                    route: '/pos/transactions',
                },
                { label: 'Menu', icon: 'fa-utensils', route: '/pos/menu' },
                {
                    label: 'Reports',
                    icon: 'fa-chart-simple',
                    route: '/pos/reports',
                },
            ],
        }
    },
    computed: {
        accountName() {
            try {
                return (
                    JSON.parse(localStorage.getItem('posfood_active_account'))
                        ?.name || 'Admin'
                )
            } catch (error) {
                return 'Admin'
            }
        },
        initials() {
            return (
                this.accountName
                    .split(' ')
                    .map((v) => v[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'AT'
            )
        },
    },
    methods: {
        goHome() {
            this.isOpen = false
            if (this.$route.path !== '/pos/start')
                this.$router.push('/pos/start')
        },
        navigate(item) {
            this.isOpen = false
            if (this.$route.path !== item.route) this.$router.push(item.route)
        },
        logout() {
            localStorage.removeItem('posfood_active_account')
            localStorage.removeItem('posfood_order_setup')
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            this.$router.push('/')
        },
    },
}
</script>
