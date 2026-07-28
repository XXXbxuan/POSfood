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
                @click="$emit('close')"
            >
                <i class="fa-solid" :class="item.icon"></i>
                <span>{{ item.label }}</span>
            </RouterLink>
        </nav>

        <div class="sidebar-tools" aria-label="Quick inventory tools">
            <button
                v-for="tool in tools"
                :key="tool.id"
                type="button"
                :class="tool.tone"
                :aria-label="tool.label"
                :title="tool.label"
                @click="$emit('action', tool.id)"
            >
                <i class="fa-solid" :class="tool.icon"></i>
                <span>{{ tool.label }}</span>
            </button>
        </div>
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
    },
    emits: ['close', 'action'],
    data() {
        return {
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', to: '/inventory/dashboard' },
                { id: 'products', label: 'Products', icon: 'fa-box', to: '/inventory/products' },
                { id: 'receive', label: 'Receive Stock', icon: 'fa-truck-ramp-box', to: '/inventory/receive' },
                { id: 'history', label: 'Stock History', icon: 'fa-clock-rotate-left', to: '/inventory/history' },
                { id: 'labels', label: 'Print Labels', icon: 'fa-print', to: '/inventory/labels' },
            ],
            tools: [
                { id: 'register', label: 'Register Product', icon: 'fa-plus', tone: 'register' },
                { id: 'scan', label: 'Scan Product', icon: 'fa-qrcode', tone: 'scan' },
                { id: 'in', label: 'Stock In', icon: 'fa-arrow-down', tone: 'stock-in' },
                { id: 'out', label: 'Stock Out', icon: 'fa-arrow-up', tone: 'stock-out' },
            ],
        }
    },
}
</script>
