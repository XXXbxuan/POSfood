<template>
    <div class="page-stack">
        <section class="page-heading dashboard-heading">
            <div>
                <span class="eyebrow">{{ greeting }}</span>
                <h1>Inventory Dashboard</h1>
                <p>Live stock position across Main Warehouse.</p>
            </div>
            <span class="date-chip"><i class="fa-regular fa-calendar"></i>{{ formattedDate }}</span>
        </section>

        <section class="quick-actions">
            <RouterLink class="quick-action primary-action" to="/inventory/scan">
                <span><i class="fa-solid fa-qrcode"></i></span>
                <div><strong>Scan Product</strong><small>Find and update stock</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
            <RouterLink class="quick-action" to="/inventory/receive">
                <span><i class="fa-solid fa-truck-ramp-box"></i></span>
                <div><strong>Receive Stock</strong><small>Add delivery and batch</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
            <RouterLink class="quick-action" :to="{ path: '/inventory/scan', query: { action: 'in' } }">
                <span class="teal"><i class="fa-solid fa-arrow-down"></i></span>
                <div><strong>Stock In</strong><small>Top up an item</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
            <RouterLink class="quick-action" :to="{ path: '/inventory/scan', query: { action: 'out' } }">
                <span class="red"><i class="fa-solid fa-arrow-up"></i></span>
                <div><strong>Stock Out</strong><small>Deduct an item</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
        </section>

        <section class="metric-grid">
            <article>
                <span class="metric-icon blue"><i class="fa-solid fa-box"></i></span>
                <div><small>Total Products</small><strong>{{ stats.totalProducts }}</strong><p>Active items</p></div>
            </article>
            <article>
                <span class="metric-icon charcoal"><i class="fa-solid fa-boxes-stacked"></i></span>
                <div><small>Total Stock</small><strong>{{ compact(stats.totalQuantity) }}</strong><p>Across all units</p></div>
            </article>
            <article>
                <span class="metric-icon amber"><i class="fa-solid fa-triangle-exclamation"></i></span>
                <div><small>Low Stock</small><strong>{{ stats.lowStock.length }}</strong><p>Needs reorder</p></div>
            </article>
            <article>
                <span class="metric-icon red"><i class="fa-solid fa-circle-xmark"></i></span>
                <div><small>Out of Stock</small><strong>{{ stats.outOfStock.length }}</strong><p>Unavailable items</p></div>
            </article>
        </section>

        <section class="dashboard-grid">
            <article class="panel stock-alert-panel">
                <header class="panel-header">
                    <div><span class="eyebrow">STOCK ALERTS</span><h2>Needs attention</h2></div>
                    <RouterLink to="/inventory/products">View products<i class="fa-solid fa-arrow-right"></i></RouterLink>
                </header>
                <div class="alert-list">
                    <RouterLink
                        v-for="product in alertProducts"
                        :key="product.id"
                        :to="{ path: '/inventory/scan', query: { code: product.sku } }"
                    >
                        <span class="product-symbol">{{ product.name.slice(0, 2).toUpperCase() }}</span>
                        <div><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }} · {{ product.location }}</small></div>
                        <span class="stock-value">{{ product.currentStock }} <small>{{ product.unit }}</small></span>
                        <span class="status-badge" :class="statusClass(product)">{{ store.productStatus(product) }}</span>
                    </RouterLink>
                    <div v-if="!alertProducts.length" class="empty-state compact">
                        <i class="fa-solid fa-circle-check"></i><strong>Stock levels look good</strong>
                    </div>
                </div>
            </article>

            <article class="panel activity-panel">
                <header class="panel-header">
                    <div><span class="eyebrow">TODAY</span><h2>Recent activity</h2></div>
                    <RouterLink to="/inventory/history">All history<i class="fa-solid fa-arrow-right"></i></RouterLink>
                </header>
                <div class="activity-list">
                    <div v-for="movement in store.state.movements.slice(0, 5)" :key="movement.id">
                        <span :class="movement.changedQuantity > 0 ? 'in' : 'out'">
                            <i class="fa-solid" :class="movement.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'"></i>
                        </span>
                        <div><strong>{{ movement.productName }}</strong><small>{{ movement.reason }} · {{ movement.staffName }}</small></div>
                        <div class="activity-quantity" :class="movement.changedQuantity > 0 ? 'positive' : 'negative'">
                            {{ movement.changedQuantity > 0 ? '+' : '' }}{{ movement.changedQuantity }}
                            <small>{{ time(movement.createdAt) }}</small>
                        </div>
                    </div>
                </div>
            </article>
        </section>

        <section class="daily-strip">
            <div><span class="stock-in"><i class="fa-solid fa-arrow-down"></i></span><p>Today Stock In<strong>+{{ stats.todayIn }}</strong></p></div>
            <div><span class="stock-out"><i class="fa-solid fa-arrow-up"></i></span><p>Today Stock Out<strong>-{{ stats.todayOut }}</strong></p></div>
            <div><span class="expiry"><i class="fa-regular fa-clock"></i></span><p>Expiring Soon<strong>{{ stats.expiring.length }}</strong></p></div>
            <div><span class="value"><i class="fa-solid fa-coins"></i></span><p>Stock Value<strong>RM {{ money(stats.stockValue) }}</strong></p></div>
        </section>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'DashboardView',
    data: () => ({ store: inventoryStore }),
    computed: {
        stats() {
            return this.store.dashboardStats()
        },
        alertProducts() {
            return [...this.stats.outOfStock, ...this.stats.lowStock].slice(0, 5)
        },
        greeting() {
            const hour = new Date().getHours()
            return `${hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING'}, ${this.store.state.activeAccount.name.split(' ')[0].toUpperCase()}`
        },
        formattedDate() {
            return new Intl.DateTimeFormat('en-MY', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(new Date())
        },
    },
    methods: {
        compact(value) {
            return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)
        },
        money(value) {
            return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
        },
        time(value) {
            return new Intl.DateTimeFormat('en-MY', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
        },
        statusClass(product) {
            return `status-${this.store.productStatus(product).toLowerCase().replaceAll(' ', '-')}`
        },
    },
}
</script>
