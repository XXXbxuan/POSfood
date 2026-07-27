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

        <div class="inv-sidebar-footer">
            <span class="status-dot"></span>
            <div><strong>System online</strong><small>Main Warehouse</small></div>
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
    emits: ['close'],
    data() {
        return {
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', to: '/inventory/dashboard' },
                { id: 'products', label: 'Products', icon: 'fa-box', to: '/inventory/products' },
                { id: 'receive', label: 'Receive Stock', icon: 'fa-truck-ramp-box', to: '/inventory/receive' },
                { id: 'scan', label: 'Scan Product', icon: 'fa-qrcode', to: '/inventory/scan' },
                { id: 'history', label: 'Stock History', icon: 'fa-clock-rotate-left', to: '/inventory/history' },
                { id: 'labels', label: 'Print Labels', icon: 'fa-print', to: '/inventory/labels' },
            ],
        }
    },
}
</script>
