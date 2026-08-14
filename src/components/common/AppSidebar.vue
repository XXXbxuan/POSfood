<template>
    <template v-if="open">
        <button
            class="inv-menu-scrim"
            type="button"
            aria-label="Close navigation menu"
            @click="$emit('close')"
        ></button>

        <section class="inv-menu-panel" role="dialog" aria-modal="true" aria-label="Inventory navigation">
            <header class="inv-menu-header">
                <div>
                    <span>INVENTORY MENU</span>
                    <h2>Navigation</h2>
                </div>
                <button class="inv-menu-close" type="button" aria-label="Close menu" @click="$emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>

            <nav class="inv-menu-grid" aria-label="Main navigation">
                <RouterLink
                    v-for="item in visibleItems"
                    :key="item.id"
                    :to="item.to"
                    :class="{ active: active === item.id }"
                    active-class="sidebar-route-match"
                    exact-active-class="sidebar-route-exact-match"
                    @click.capture="handleNavigation($event, item)"
                >
                    <span class="inv-menu-icon">
                        <i class="fa-solid" :class="item.icon"></i>
                    </span>
                    <strong>{{ item.label }}</strong>
                </RouterLink>
            </nav>
        </section>
    </template>
</template>

<script>
import { hasPermission, PERMISSIONS } from '@/services/permissions'

export default {
    name: 'AppSidebar',
    props: {
        active: { type: String, default: '' },
        open: { type: Boolean, default: false },
        account: { type: Object, default: null },
    },
    emits: ['close'],
    data() {
        return {
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-table-cells-large', to: '/inventory/dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
                { id: 'reports', label: 'Reports', icon: 'fa-chart-pie', to: '/inventory/reports', permission: PERMISSIONS.VIEW_REPORTS },
                { id: 'products', label: 'Products', icon: 'fa-box', to: '/inventory/products', permission: PERMISSIONS.VIEW_PRODUCTS },
                { id: 'warehouses', label: 'Warehouses', icon: 'fa-boxes-stacked', to: '/inventory/warehouses', permission: PERMISSIONS.VIEW_WAREHOUSES },
                { id: 'stock-movement', label: 'Stock Movement', icon: 'fa-right-left', to: '/inventory/dispatch?mode=move', permission: PERMISSIONS.ISSUE_STOCK },
                { id: 'supplier-requests', label: 'Supplier Requests', icon: 'fa-list-check', to: '/inventory/stock-movement-requests', permission: PERMISSIONS.RECEIVE_STOCK },
                { id: 'dispatch', label: 'Ship Items', icon: 'fa-truck-arrow-right', to: '/inventory/dispatch', permission: PERMISSIONS.ISSUE_STOCK },
                { id: 'history', label: 'Stock History', icon: 'fa-clock-rotate-left', to: '/inventory/history', permission: PERMISSIONS.VIEW_STOCK_HISTORY },
                { id: 'labels', label: 'Print Labels', icon: 'fa-print', to: '/inventory/labels', permission: PERMISSIONS.PRINT_LABELS },
                { id: 'suppliers', label: 'Suppliers', icon: 'fa-truck-fast', to: '/inventory/suppliers', permission: PERMISSIONS.VIEW_SUPPLIERS },
                { id: 'staff', label: 'Staff', icon: 'fa-users-gear', to: '/inventory/staff', permission: PERMISSIONS.VIEW_STAFF },
            ],
        }
    },
    computed: {
        visibleItems() {
            return this.items.filter((item) => hasPermission(this.account, item.permission))
        },
    },
    methods: {
        handleNavigation(event, item) {
            this.$emit('close')
            if (item.id !== 'labels') return
            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation?.()
            this.$router.replace({ path: item.to, query: { reset: String(Date.now()) } })
        },
    },
}
</script>

<style scoped src="@/assets/css/components/app-sidebar.css"></style>
