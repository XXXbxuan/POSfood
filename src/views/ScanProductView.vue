<template>
    <div class="page-stack scan-page">
        <section class="page-heading">
            <div><h1>Scan Product</h1></div>
            <button class="button primary" type="button" @click="scannerOpen = true">
                <i class="fa-solid fa-qrcode"></i>{{ product ? 'Scan Another' : 'Open Scanner' }}
            </button>
        </section>

        <div class="scan-content-scroll">
        <section v-if="!product" class="scan-landing">
            <button class="scan-hero" type="button" @click="scannerOpen = true">
                <span class="scan-hero-icon"><i class="fa-solid fa-qrcode"></i></span>
                <strong>Tap to scan</strong>
                <p>Product QR · BAR · Batch label</p>
                <span class="scan-line-decoration"></span>
            </button>
            <form class="manual-lookup panel" @submit.prevent="lookup(manualCode)">
                <label><span>Enter code instead</span><div><i class="fa-solid fa-keyboard"></i><input v-model.trim="manualCode" type="text" placeholder="Product code or BAR" /><button class="button secondary" type="submit">Find</button></div></label>
                <p v-if="error" class="form-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
            </form>
        </section>

        <template v-else>
            <div class="scan-hero-workspace" :class="{ 'with-operation': operation }">
            <section class="product-detail-hero panel">
                <div class="product-detail-symbol">{{ product.name.slice(0, 2).toUpperCase() }}</div>
                <div class="product-detail-title">
                    <div><span class="status-badge" :class="statusClass">{{ store.productStatus(product) }}</span><span class="product-type">{{ product.type }}</span></div>
                    <h1>{{ product.name }}</h1>
                    <p class="mono">{{ product.sku }} · {{ product.bar }}</p>
                </div>
                <div class="hero-stock">
                    <small>Current Stock</small>
                    <strong>{{ product.currentStock }}</strong>
                    <span>{{ product.unit }}</span>
                </div>
            </section>
            <StockOperationForm
                v-if="operation"
                :product="product"
                :direction="operation"
                @close="operation = ''"
                @completed="completeOperation"
            />
            </div>

            <section class="product-operations">
                <button class="operation-button stock-in" type="button" @click="openOperation('in')">
                    <span><i class="fa-solid fa-arrow-down"></i></span><div><strong>Stock In</strong><small>Add quantity</small></div>
                </button>
                <button class="operation-button stock-out" type="button" @click="openOperation('out')">
                    <span><i class="fa-solid fa-arrow-up"></i></span><div><strong>Stock Out</strong><small>Deduct quantity</small></div>
                </button>
                <RouterLink class="operation-button neutral" :to="{ path: '/inventory/history', query: { product: product.sku } }">
                    <span><i class="fa-solid fa-clock-rotate-left"></i></span><div><strong>History</strong><small>View movements</small></div>
                </RouterLink>
                <RouterLink class="operation-button neutral" :to="{ path: '/inventory/labels', query: { product: product.sku } }">
                    <span><i class="fa-solid fa-print"></i></span><div><strong>Print Label</strong><small>Product or batch</small></div>
                </RouterLink>
            </section>

            <section class="detail-grid">
                <article class="panel product-info-panel">
                    <header class="panel-header"><div><span class="eyebrow">PRODUCT DETAILS</span><h2>Stock information</h2></div></header>
                    <dl class="detail-list">
                        <div><dt>Available Stock</dt><dd>{{ product.currentStock }} {{ product.unit }}</dd></div>
                        <div><dt>Low Stock Level</dt><dd>{{ product.minimumStock }} {{ product.unit }}</dd></div>
                        <div><dt>Warehouse Location</dt><dd><i class="fa-solid fa-location-dot"></i>{{ product.location || 'Not assigned' }}</dd></div>
                        <div><dt>Supplier</dt><dd>{{ product.supplier || 'Not assigned' }}</dd></div>
                        <div><dt>Category</dt><dd>{{ product.category }}</dd></div>
                        <div><dt>Cost Price</dt><dd>RM {{ money(product.costPrice) }}</dd></div>
                        <div><dt>Last Stock In</dt><dd>{{ dateTime(product.lastStockIn) }}</dd></div>
                        <div><dt>Last Stock Out</dt><dd>{{ dateTime(product.lastStockOut) }}</dd></div>
                    </dl>
                </article>

                <article class="panel batch-panel">
                    <header class="panel-header"><div><span class="eyebrow">BATCHES</span><h2>{{ product.batches.length }} active records</h2></div></header>
                    <div v-if="product.batches.length" class="batch-list">
                        <div v-for="batch in product.batches" :key="batch.id">
                            <span class="batch-box"><i class="fa-solid fa-box"></i></span>
                            <div><strong class="mono">{{ batch.id }}</strong><small>{{ batch.location }}</small></div>
                            <div><strong>{{ batch.quantity }} {{ product.unit }}</strong><small>Expiry {{ date(batch.expiryDate) }}</small></div>
                            <span v-if="store.expiryStatus(batch)" class="status-badge" :class="expiryClass(batch)">{{ store.expiryStatus(batch) }}</span>
                        </div>
                    </div>
                    <div v-else class="empty-state compact"><i class="fa-solid fa-layer-group"></i><strong>No tracked batches</strong><p>This product uses aggregate stock.</p></div>
                </article>
            </section>

            <section class="panel product-movement-preview">
                <header class="panel-header">
                    <div><span class="eyebrow">LATEST MOVEMENTS</span><h2>Product activity</h2></div>
                    <RouterLink :to="{ path: '/inventory/history', query: { product: product.sku } }">View all<i class="fa-solid fa-arrow-right"></i></RouterLink>
                </header>
                <div class="movement-preview-list">
                    <div v-for="item in productMovements.slice(0, 4)" :key="item.id">
                        <span :class="item.changedQuantity > 0 ? 'in' : 'out'"><i class="fa-solid" :class="item.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'"></i></span>
                        <div><strong>{{ item.reason }}</strong><small>{{ item.staffName }} · {{ dateTime(item.createdAt) }}</small></div>
                        <strong :class="item.changedQuantity > 0 ? 'positive' : 'negative'">{{ item.changedQuantity > 0 ? '+' : '' }}{{ item.changedQuantity }}</strong>
                        <small class="mono">{{ item.id }}</small>
                    </div>
                    <div v-if="!productMovements.length" class="empty-state compact"><strong>No movement recorded yet.</strong></div>
                </div>
            </section>
        </template>
        </div>

        <ScannerModal v-if="scannerOpen" @close="scannerOpen = false" @scanned="handleScan" />
    </div>
</template>

<script>
import ScannerModal from '@/components/ScannerModal.vue'
import StockOperationForm from '@/components/StockOperationForm.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'ScanProductView',
    components: { ScannerModal, StockOperationForm },
    data() {
        return {
            store: inventoryStore,
            product: null,
            scannerOpen: false,
            operation: '',
            manualCode: '',
            error: '',
        }
    },
    computed: {
        statusClass() {
            return `status-${this.store.productStatus(this.product).toLowerCase().replaceAll(' ', '-')}`
        },
        productMovements() {
            return this.store.state.movements.filter((item) => item.productId === this.product?.id)
        },
    },
    mounted() {
        if (this.$route.query.code) this.lookup(this.$route.query.code)
    },
    methods: {
        lookup(value) {
            this.error = ''
            const product = this.store.findProduct(value)
            if (!product) {
                this.product = null
                this.error = 'No product matches this code.'
                return
            }
            this.product = product
            this.manualCode = ''
            if (['in', 'out'].includes(this.$route.query.action))
                this.operation = this.$route.query.action
        },
        handleScan(value) {
            this.scannerOpen = false
            this.lookup(value)
        },
        openOperation(direction) {
            this.operation = direction
        },
        completeOperation() {
            this.operation = ''
        },
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        date(value) {
            if (!value) return 'Not tracked'
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
        },
        dateTime(value) {
            if (!value) return 'No record'
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
        },
        expiryClass(batch) {
            return `status-${this.store.expiryStatus(batch).toLowerCase().replaceAll(' ', '-')}`
        },
    },
}
</script>
