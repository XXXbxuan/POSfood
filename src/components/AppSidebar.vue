<template>
    <aside class="inv-sidebar" :class="{ open }">
        <div class="inv-brand">
            <span class="inv-brand-mark"><i class="fa-solid fa-boxes-stacked"></i></span>
            <span>
                <strong>INVENTORY</strong>
                <small>MANAGEMENT SYSTEM</small>
            </span>
        </div>

        <nav aria-label="Main navigation">
            <RouterLink
                v-for="item in items"
                :key="item.id"
                :to="item.to"
                :class="{ active: active === item.id }"
                :aria-label="item.label"
                :title="item.label"
                @click="$emit('close')"
            >
                <i class="fa-solid" :class="item.icon"></i>
                <span>{{ item.label }}</span>
            </RouterLink>
        </nav>

        <button class="sidebar-profile" type="button" aria-label="Open account menu" @click="$emit('profile')">
            <span>{{ initials }}</span>
            <div><strong>{{ account.name }}</strong><small>{{ account.role }}</small></div>
        </button>
    </aside>
    <button
        v-if="open"
        class="inv-sidebar-scrim"
        type="button"
        aria-label="Close menu"
        @click="$emit('close')"
    ></button>
</template>

<script>
export default {
    name: 'AppSidebar',
    props: {
        active: { type: String, default: '' },
        open: { type: Boolean, default: false },
        account: { type: Object, required: true },
    },
    emits: ['close', 'profile'],
    data() {
        return {
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', to: '/inventory/dashboard' },
                { id: 'products', label: 'Products', icon: 'fa-box', to: '/inventory/products' },
                { id: 'receive', label: 'Receive Stock', icon: 'fa-truck-ramp-box', to: '/inventory/receive' },
                { id: 'history', label: 'Stock History', icon: 'fa-clock-rotate-left', to: '/inventory/history' },
                { id: 'labels', label: 'Print Labels', icon: 'fa-print', to: '/inventory/labels' },
            ],
        }
    },
    computed: {
        initials() {
            return this.account.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
    },
}
</script>
