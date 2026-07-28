<template>
    <div class="dashboard-page">
        <section class="page-heading dashboard-heading">
            <div>
                <span class="eyebrow">{{ greeting }}</span>
                <h1>Inventory Dashboard</h1>
                <p>Live stock position across Main Warehouse.</p>
            </div>
            <button class="button primary dashboard-register-button" type="button" @click="registerOpen = true">
                <i class="fa-solid fa-plus"></i>Register Product
            </button>
        </section>

        <section class="metric-grid">
            <button type="button" class="metric-card" :class="{ active: selectedMetric === 'products' }" @click="selectedMetric = 'products'">
                <span class="metric-icon blue"><i class="fa-solid fa-box"></i></span>
                <div><small>Total Products</small><strong>{{ stats.totalProducts }}</strong></div>
            </button>
            <button type="button" class="metric-card" :class="{ active: selectedMetric === 'stock' }" @click="selectedMetric = 'stock'">
                <span class="metric-icon charcoal"><i class="fa-solid fa-boxes-stacked"></i></span>
                <div><small>Total Stock</small><strong>{{ compact(stats.totalQuantity) }}</strong></div>
            </button>
            <button type="button" class="metric-card" :class="{ active: selectedMetric === 'low' }" @click="selectedMetric = 'low'">
                <span class="metric-icon amber"><i class="fa-solid fa-triangle-exclamation"></i></span>
                <div><small>Low Stock</small><strong>{{ stats.lowStock.length }}</strong></div>
            </button>
            <button type="button" class="metric-card" :class="{ active: selectedMetric === 'out' }" @click="selectedMetric = 'out'">
                <span class="metric-icon red"><i class="fa-solid fa-circle-xmark"></i></span>
                <div><small>Out of Stock</small><strong>{{ stats.outOfStock.length }}</strong></div>
            </button>
        </section>

        <section class="dashboard-grid" :class="{ 'activity-collapsed': !activityOpen }">
            <article class="panel dashboard-list-panel stock-alert-panel">
                <header class="panel-header">
                    <div><span class="eyebrow">{{ metricEyebrow }}</span><h2>{{ metricTitle }}</h2></div>
                    <span class="dashboard-list-count">{{ metricProducts.length }} items</span>
                </header>
                <div class="dashboard-scroll alert-list">
                    <button
                        v-for="product in metricProducts"
                        :key="product.id"
                        type="button"
                        @click="openProduct(product)"
                    >
                        <span class="product-symbol">{{ product.name.slice(0, 2).toUpperCase() }}</span>
                        <div><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }} &middot; {{ product.location }}</small></div>
                        <span class="stock-value">{{ product.currentStock }} <small>{{ product.unit }}</small></span>
                        <span class="status-badge" :class="statusClass(product)">{{ store.productStatus(product) }}</span>
                    </button>
                    <div v-if="!metricProducts.length" class="empty-state compact">
                        <i class="fa-solid fa-circle-check"></i><strong>No products in this view</strong>
                    </div>
                </div>
                <footer class="dashboard-panel-footer">
                    <div class="today-in"><strong><span>Today In</span>+{{ stats.todayIn }}</strong></div>
                    <div class="today-out"><strong><span>Today Out</span>-{{ stats.todayOut }}</strong></div>
                </footer>
            </article>

            <button class="activity-divider-toggle" type="button" :aria-label="activityOpen ? 'Collapse recent activity' : 'Open recent activity'" @click="activityOpen = !activityOpen">
                <i class="fa-solid" :class="activityOpen ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
            </button>

            <article class="panel dashboard-list-panel activity-panel" :class="{ collapsed: !activityOpen }">
                <header class="panel-header">
                    <div v-if="activityOpen"><span class="eyebrow">TODAY</span><h2>Recent activity</h2></div>
                    <span v-if="activityOpen" class="dashboard-list-count">{{ store.state.movements.length }} records</span>
                </header>
                <div v-if="activityOpen" class="dashboard-scroll activity-list">
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
                <footer v-if="activityOpen" class="dashboard-panel-footer">
                    <div><small>Expiring Soon</small><strong class="expiry-value">{{ stats.expiring.length }}</strong></div>
                    <div><small>Stock Value</small><strong class="primary-value">RM {{ money(stats.stockValue) }}</strong></div>
                </footer>
            </article>
        </section>

        <div v-if="pickerOpen" class="modal-backdrop" @click.self="closePicker">
            <section class="form-modal quick-workspace-modal" :class="{ 'details-only': pickerAction === 'details', 'with-operation': operation }">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">{{ pickerEyebrow }}</span>
                        <h2>{{ pickerTitle }}</h2>
                        <p v-if="pickerAction !== 'details'">Select one item. The operation stays on Dashboard.</p>
                        <p v-else>Product details and stock actions.</p>
                    </div>
                    <div class="product-detail-header-actions">
                        <button v-if="selectedProduct" class="icon-button" type="button" aria-label="Print product label" title="Print product label" @click="openProductLabel"><i class="fa-solid fa-print"></i></button>
                        <button v-if="selectedProduct" class="icon-button" type="button" aria-label="Edit product" title="Edit product" @click="editOpen = true"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-button" type="button" aria-label="Close" @click="closePicker"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </header>
                <div class="quick-workspace-body" :class="{ 'details-only': pickerAction === 'details', 'with-operation': operation }">
                    <section v-if="pickerAction !== 'details'" class="quick-product-column">
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
                                <div><dt>Barcode</dt><dd class="mono">{{ selectedProduct.barcode }}</dd></div>
                                <div><dt>Category</dt><dd>{{ selectedProduct.category }}</dd></div>
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
                    <StockOperationForm
                        v-if="operation && selectedProduct"
                        :product="selectedProduct"
                        :direction="operation"
                        @close="operation = ''"
                        @completed="completeOperation"
                    />
                </div>
            </section>
        </div>

        <ProductRegistrationModal
            v-if="registerOpen"
            @close="registerOpen = false"
            @registered="selectedMetric = 'products'"
        />
        <ProductRegistrationModal
            v-if="editOpen && selectedProduct"
            :edit-product="selectedProduct"
            @close="editOpen = false"
            @registered="editOpen = false"
        />
    </div>
</template>

<script>
import ProductRegistrationModal from '@/components/ProductRegistrationModal.vue'
import StockOperationForm from '@/components/StockOperationForm.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'DashboardView',
    components: { ProductRegistrationModal, StockOperationForm },
    data() {
        return {
            store: inventoryStore,
            pickerOpen: false,
            pickerAction: '',
            productSearch: '',
            selectedProduct: null,
            operation: '',
            selectedMetric: 'products',
            registerOpen: false,
            editOpen: false,
            activityOpen: true,
        }
    },
    computed: {
        stats() {
            return this.store.dashboardStats()
        },
        metricProducts() {
            const active = this.store.state.products.filter((product) => product.active)
            if (this.selectedMetric === 'stock') {
                return active
                    .filter((product) => Number(product.currentStock) > 0)
                    .sort((a, b) => Number(b.currentStock) - Number(a.currentStock))
            }
            if (this.selectedMetric === 'low') return this.stats.lowStock
            if (this.selectedMetric === 'out') return this.stats.outOfStock
            return active
        },
        metricTitle() {
            if (this.selectedMetric === 'stock') return 'Products with stock'
            if (this.selectedMetric === 'low') return 'Needs reorder'
            if (this.selectedMetric === 'out') return 'Unavailable products'
            return 'All products'
        },
        metricEyebrow() {
            if (this.selectedMetric === 'stock') return 'TOTAL STOCK'
            if (this.selectedMetric === 'low') return 'LOW STOCK'
            if (this.selectedMetric === 'out') return 'OUT OF STOCK'
            return 'TOTAL PRODUCTS'
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
        pickerTitle() {
            if (this.pickerAction === 'in') return 'Choose product for Stock In'
            if (this.pickerAction === 'out') return 'Choose product for Stock Out'
            return this.selectedProduct?.name || 'Product Details'
        },
        pickerEyebrow() {
            if (this.pickerAction === 'in') return 'ADD INVENTORY'
            if (this.pickerAction === 'out') return 'DEDUCT INVENTORY'
            return 'PRODUCT DETAILS'
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
            if (this.editOpen) return
            this.pickerOpen = false
            this.productSearch = ''
            this.operation = ''
        },
        openProduct(product) {
            if (product) this.openPicker('details', product)
        },
        openProductLabel() {
            this.$router.push({ name: 'labels', query: { product: this.selectedProduct.id } })
        },
        continueOperation() {
            this.operation = this.pickerAction
        },
        startSelectedOperation(direction) {
            this.operation = this.operation === direction ? '' : direction
        },
        completeOperation() {
            this.operation = ''
        },
    },
}
</script>
