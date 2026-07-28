<template>
    <div class="dashboard-page">
        <section class="page-heading dashboard-heading">
            <div>
                <span class="eyebrow">{{ greeting }}</span>
                <h1>Inventory Dashboard</h1>
                <p>Live stock position across Main Warehouse.</p>
            </div>
            <span class="date-chip"><i class="fa-regular fa-calendar"></i>{{ formattedDate }}</span>
        </section>

        <section class="quick-actions">
            <button class="quick-action primary-action" type="button" @click="openScanner">
                <span><i class="fa-solid fa-qrcode"></i></span>
                <div><strong>Scan Product</strong><small>Find & update stock</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
            <RouterLink class="quick-action" to="/inventory/receive">
                <span><i class="fa-solid fa-truck-ramp-box"></i></span>
                <div><strong>Receive Stock</strong><small>Add delivery & batch</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
            <button class="quick-action" type="button" @click="openPicker('in')">
                <span class="teal"><i class="fa-solid fa-arrow-down"></i></span>
                <div><strong>Stock In</strong><small>Top up an item</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
            <button class="quick-action" type="button" @click="openPicker('out')">
                <span class="red"><i class="fa-solid fa-arrow-up"></i></span>
                <div><strong>Stock Out</strong><small>Deduct an item</small></div>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
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
                <div><small>Out of Stock</small><strong>{{ stats.outOfStock.length }}</strong><p>Unavailable</p></div>
            </article>
        </section>

        <section class="dashboard-grid">
            <article class="panel dashboard-list-panel stock-alert-panel">
                <header class="panel-header">
                    <div><span class="eyebrow">STOCK ALERTS</span><h2>Needs attention</h2></div>
                    <RouterLink to="/inventory/products">View products<i class="fa-solid fa-arrow-right"></i></RouterLink>
                </header>
                <div class="dashboard-scroll alert-list">
                    <button
                        v-for="product in alertProducts"
                        :key="product.id"
                        type="button"
                        @click="openProduct(product)"
                    >
                        <span class="product-symbol">{{ product.name.slice(0, 2).toUpperCase() }}</span>
                        <div><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }} &middot; {{ product.location }}</small></div>
                        <span class="stock-value">{{ product.currentStock }} <small>{{ product.unit }}</small></span>
                        <span class="status-badge" :class="statusClass(product)">{{ store.productStatus(product) }}</span>
                    </button>
                    <div v-if="!alertProducts.length" class="empty-state compact">
                        <i class="fa-solid fa-circle-check"></i><strong>Stock levels look good</strong>
                    </div>
                </div>
                <footer class="dashboard-panel-footer">
                    <div><small>Today In</small><strong class="positive">+{{ stats.todayIn }}</strong></div>
                    <div><small>Today Out</small><strong class="negative">-{{ stats.todayOut }}</strong></div>
                </footer>
            </article>

            <article class="panel dashboard-list-panel activity-panel">
                <header class="panel-header">
                    <div><span class="eyebrow">TODAY</span><h2>Recent activity</h2></div>
                    <RouterLink to="/inventory/history">All history<i class="fa-solid fa-arrow-right"></i></RouterLink>
                </header>
                <div class="dashboard-scroll activity-list">
                    <button
                        v-for="movement in store.state.movements"
                        :key="movement.id"
                        type="button"
                        @click="openProduct(store.findProduct(movement.productId))"
                    >
                        <span :class="movement.changedQuantity > 0 ? 'in' : 'out'">
                            <i class="fa-solid" :class="movement.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'"></i>
                        </span>
                        <div><strong>{{ movement.productName }}</strong><small>{{ movement.reason }} &middot; {{ movement.staffName }}</small></div>
                        <div class="activity-quantity" :class="movement.changedQuantity > 0 ? 'positive' : 'negative'">
                            {{ movement.changedQuantity > 0 ? '+' : '' }}{{ movement.changedQuantity }}
                            <small>{{ time(movement.createdAt) }}</small>
                        </div>
                    </button>
                </div>
                <footer class="dashboard-panel-footer">
                    <div><small>Expiring Soon</small><strong class="expiry-value">{{ stats.expiring.length }}</strong></div>
                    <div><small>Stock Value</small><strong class="primary-value">RM {{ money(stats.stockValue) }}</strong></div>
                </footer>
            </article>
        </section>

        <div v-if="pickerOpen" class="modal-backdrop" @click.self="closePicker">
            <section class="form-modal quick-workspace-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">{{ pickerEyebrow }}</span>
                        <h2>{{ pickerTitle }}</h2>
                        <p>Select one item. The operation stays on Dashboard.</p>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closePicker">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="quick-workspace-body">
                    <section class="quick-product-column">
                        <label class="search-field">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input v-model.trim="productSearch" type="search" placeholder="Search product or SKU" />
                        </label>
                        <div class="quick-product-list">
                            <button
                                v-for="item in filteredProducts"
                                :key="item.id"
                                type="button"
                                :class="{ selected: selectedProduct?.id === item.id }"
                                @click="selectedProduct = item"
                            >
                                <span>{{ item.name.slice(0, 2).toUpperCase() }}</span>
                                <div><strong>{{ item.name }}</strong><small class="mono">{{ item.sku }} &middot; {{ item.location }}</small></div>
                                <b>{{ item.currentStock }} <small>{{ item.unit }}</small></b>
                            </button>
                        </div>
                    </section>

                    <section class="quick-product-preview">
                        <template v-if="selectedProduct">
                            <span class="quick-preview-symbol">{{ selectedProduct.name.slice(0, 2).toUpperCase() }}</span>
                            <span class="status-badge" :class="statusClass(selectedProduct)">{{ store.productStatus(selectedProduct) }}</span>
                            <h3>{{ selectedProduct.name }}</h3>
                            <p class="mono">{{ selectedProduct.sku }}</p>
                            <div class="quick-preview-stock">
                                <small>Current Stock</small>
                                <strong>{{ selectedProduct.currentStock }}</strong>
                                <span>{{ selectedProduct.unit }}</span>
                            </div>
                            <dl>
                                <div><dt>Location</dt><dd>{{ selectedProduct.location }}</dd></div>
                                <div><dt>Minimum</dt><dd>{{ selectedProduct.minimumStock }} {{ selectedProduct.unit }}</dd></div>
                                <div><dt>Supplier</dt><dd>{{ selectedProduct.supplier }}</dd></div>
                            </dl>
                            <button
                                v-if="pickerAction === 'in' || pickerAction === 'out'"
                                class="button full-width"
                                :class="pickerAction === 'in' ? 'stock-in' : 'stock-out'"
                                type="button"
                                @click="continueOperation"
                            >
                                <i class="fa-solid" :class="pickerAction === 'in' ? 'fa-arrow-down' : 'fa-arrow-up'"></i>
                                Continue to {{ pickerAction === 'in' ? 'Stock In' : 'Stock Out' }}
                            </button>
                            <div v-else class="quick-preview-actions">
                                <button class="button stock-in" type="button" @click="startSelectedOperation('in')">Stock In</button>
                                <button class="button stock-out" type="button" @click="startSelectedOperation('out')">Stock Out</button>
                            </div>
                        </template>
                        <div v-else class="summary-placeholder">
                            <i class="fa-solid fa-box"></i>
                            <p>Select a product from the list.</p>
                        </div>
                    </section>
                </div>
            </section>
        </div>

        <ScannerModal
            v-if="scannerOpen"
            @close="scannerOpen = false"
            @scanned="handleScan"
        />
        <StockOperationModal
            v-if="operation"
            :product="selectedProduct"
            :direction="operation"
            @close="operation = ''"
            @completed="completeOperation"
        />
    </div>
</template>

<script>
import ScannerModal from '@/components/ScannerModal.vue'
import StockOperationModal from '@/components/StockOperationModal.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'DashboardView',
    components: { ScannerModal, StockOperationModal },
    data() {
        return {
            store: inventoryStore,
            pickerOpen: false,
            pickerAction: '',
            productSearch: '',
            selectedProduct: null,
            scannerOpen: false,
            operation: '',
        }
    },
    computed: {
        stats() {
            return this.store.dashboardStats()
        },
        alertProducts() {
            return [...this.stats.outOfStock, ...this.stats.lowStock]
        },
        filteredProducts() {
            const search = this.productSearch.toLowerCase()
            return this.store.state.products.filter(
                (product) =>
                    product.active &&
                    (!search ||
                        [product.name, product.sku, product.barcode].some((value) =>
                            String(value).toLowerCase().includes(search),
                        )),
            )
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
        pickerTitle() {
            if (this.pickerAction === 'in') return 'Choose product for Stock In'
            if (this.pickerAction === 'out') return 'Choose product for Stock Out'
            return 'Product quick view'
        },
        pickerEyebrow() {
            if (this.pickerAction === 'in') return 'ADD INVENTORY'
            if (this.pickerAction === 'out') return 'DEDUCT INVENTORY'
            return 'PRODUCT'
        },
    },
    methods: {
        compact(value) {
            return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)
        },
        money(value) {
            return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
        },
        time(value) {
            return new Intl.DateTimeFormat('en-MY', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
        },
        statusClass(product) {
            return `status-${this.store.productStatus(product).toLowerCase().replaceAll(' ', '-')}`
        },
        openPicker(action, product = null) {
            this.pickerAction = action
            this.productSearch = ''
            this.selectedProduct = product
            this.pickerOpen = true
        },
        closePicker() {
            this.pickerOpen = false
            this.productSearch = ''
        },
        openProduct(product) {
            if (product) this.openPicker('view', product)
        },
        openScanner() {
            this.scannerOpen = true
        },
        handleScan(value) {
            this.scannerOpen = false
            const product = this.store.findProduct(value)
            if (!product) {
                this.store.addToast('Product code was not recognised.', 'danger')
                return
            }
            this.openProduct(product)
        },
        continueOperation() {
            this.pickerOpen = false
            this.operation = this.pickerAction
        },
        startSelectedOperation(direction) {
            this.pickerOpen = false
            this.operation = direction
        },
        completeOperation() {
            this.operation = ''
            this.selectedProduct = null
        },
    },
}
</script>
