<template>
    <div class="page-stack scan-page">
        <section class="page-heading scan-page-heading">
            <div class="page-title-row">
                <button v-if="$route.query.from === 'dashboard'" class="page-back-link" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <h1 class="inventory-page-title">Scan Product</h1>
            </div>
            <button v-if="product || batch" class="button secondary" type="button" @click="resetScanner">
                <i class="fa-solid fa-rotate"></i>Scan Another
            </button>
        </section>

        <div class="scan-content-scroll" :class="{ 'has-result': product || batch }">
            <section v-if="!product && !batch" class="scan-direct-shell panel">
                <div class="scan-direct-header">
                    <div>
                        <span class="eyebrow">INVENTORY LOOKUP</span>
                        <h2>Find product or batch</h2>
                    </div>
                </div>

                <div class="scan-method-toggle">
                    <button type="button" :class="{ active: method === 'camera' }" @click="setMethod('camera')">
                        <i class="fa-solid fa-camera"></i>Scan Camera
                    </button>
                    <button type="button" :class="{ active: method === 'manual' }" @click="setMethod('manual')">
                        <i class="fa-solid fa-keyboard"></i>Enter Code
                    </button>
                </div>

                <div v-if="method === 'camera'" class="scan-inline-stage">
                    <div :id="readerId" class="scan-inline-reader"></div>
                    <div v-if="cameraError" class="scan-inline-fallback">
                        <span><i class="fa-solid fa-camera"></i></span>
                        <strong>Camera is not available</strong>
                        <p>{{ cameraError }}</p>
                        <button class="button secondary" type="button" @click="setMethod('manual')">Enter code instead</button>
                    </div>
                    <div v-else class="scan-inline-frame" aria-hidden="true">
                        <i></i><i></i><i></i><i></i>
                        <span></span>
                    </div>
                </div>

                <form v-else class="scan-inline-manual" @submit.prevent="submitManual">
                    <label>
                        <span>Product / Batch code</span>
                        <div class="scan-inline-input-row">
                            <input v-model.trim="manualCode" type="text" placeholder="Product code or BAR" autocomplete="off" autofocus />
                            <button class="button primary" type="submit" :disabled="!manualCode">Find</button>
                        </div>
                    </label>
                </form>

                <p v-if="error" class="form-error scan-inline-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
            </section>

            <template v-else-if="product">
                <section class="scan-result-layout" :class="{ 'with-operation': operation }">
                    <div class="scan-result-primary">
                        <article class="panel scan-product-card">
                            <header class="scan-product-identity">
                                <span class="scan-product-symbol">{{ product.name.slice(0, 2).toUpperCase() }}</span>
                                <div class="scan-product-copy">
                                    <div class="scan-product-tags">
                                        <span class="status-badge" :class="statusClass">{{ store.productStatus(product) }}</span>
                                        <span>{{ product.type }}</span>
                                    </div>
                                    <h2>{{ product.name }}</h2>
                                    <p class="mono">{{ product.sku }} · {{ product.bar }}</p>
                                </div>
                                <div class="scan-product-stock">
                                    <small>Current Stock</small>
                                    <strong>{{ formatQuantity(currentStock) }}</strong>
                                    <span>{{ product.unit }}</span>
                                </div>
                            </header>

                            <dl class="scan-product-facts">
                                <div><dt>Warehouse location</dt><dd><i class="fa-solid fa-location-dot"></i>{{ locationSummary }}</dd></div>
                                <div><dt>Minimum stock</dt><dd>{{ formatQuantity(product.minimumStock) }} {{ product.unit }}</dd></div>
                                <div><dt>Tracking</dt><dd>{{ trackingLabel }}</dd></div>
                                <div><dt>Receipt layers</dt><dd>{{ product.batches.length }}</dd></div>
                                <div><dt>Supplier</dt><dd>{{ product.supplier || 'Not assigned' }}</dd></div>
                                <div><dt>Cost price</dt><dd>RM {{ money(product.costPrice) }}</dd></div>
                            </dl>
                        </article>

                        <article class="panel scan-activity-card">
                            <header class="scan-section-header">
                                <div>
                                    <span class="eyebrow">LATEST MOVEMENTS</span>
                                    <h2>Product activity</h2>
                                </div>
                                <RouterLink v-if="canViewHistory" :to="historyRoute">View all<i class="fa-solid fa-arrow-right"></i></RouterLink>
                            </header>
                            <div class="scan-movement-list">
                                <div v-for="item in productMovements.slice(0, 4)" :key="item.id">
                                    <span :class="movementTone(item)"><i class="fa-solid" :class="movementIcon(item)"></i></span>
                                    <div><strong>{{ item.reason }}</strong><small>{{ dateTime(item.createdAt) }}</small></div>
                                    <strong :class="movementQuantityClass(item)">{{ movementQuantityLabel(item) }}</strong>
                                </div>
                                <div v-if="!productMovements.length" class="empty-state compact"><i class="fa-solid fa-clock-rotate-left"></i><strong>No movement recorded yet.</strong></div>
                            </div>
                        </article>
                    </div>

                    <aside class="panel scan-actions-card">
                        <template v-if="!operation">
                            <header class="scan-section-header">
                                <div>
                                    <span class="eyebrow">SCANNED PRODUCT</span>
                                    <h2>Stock actions</h2>
                                </div>
                                <span class="scan-ready-badge"><i class="fa-solid fa-circle-check"></i>Ready</span>
                            </header>

                            <div class="scan-action-grid">
                                <button v-if="canReceive" class="scan-action-button stock-in" type="button" @click="openOperation('in')">
                                    <span><i class="fa-solid fa-arrow-down"></i></span>
                                    <div><strong>Stock In</strong><small>Receive this product</small></div>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                                <button v-if="canIssue" class="scan-action-button stock-out" type="button" @click="openOperation('out')">
                                    <span><i class="fa-solid fa-arrow-up"></i></span>
                                    <div><strong>Stock Out</strong><small>Remove or use stock</small></div>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                                <RouterLink v-if="canViewHistory" class="scan-action-button neutral" :to="historyRoute">
                                    <span><i class="fa-solid fa-clock-rotate-left"></i></span>
                                    <div><strong>History</strong><small>View this product only</small></div>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </RouterLink>
                                <RouterLink v-if="canPrint" class="scan-action-button neutral" :to="labelsRoute">
                                    <span><i class="fa-solid fa-print"></i></span>
                                    <div><strong>Print Label</strong><small>Open label setup</small></div>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </RouterLink>
                            </div>

                            <section class="scan-action-summary">
                                <div><span>Status</span><strong>{{ store.productStatus(product) }}</strong></div>
                                <div><span>Available</span><strong>{{ formatQuantity(currentStock) }} {{ product.unit }}</strong></div>
                                <div><span>Last stock in</span><strong>{{ dateTime(product.lastStockIn) }}</strong></div>
                                <div><span>Last stock out</span><strong>{{ dateTime(product.lastStockOut) }}</strong></div>
                            </section>

                            <div v-if="!canReceive && !canIssue && !canViewHistory && !canPrint" class="empty-state compact scan-no-actions">
                                <i class="fa-solid fa-lock"></i>
                                <strong>No stock actions are available for this account.</strong>
                            </div>
                        </template>

                        <StockOperationForm
                            v-else
                            :product="product"
                            :direction="operation"
                            @close="operation = ''"
                            @completed="completeOperation"
                        />
                    </aside>
                </section>
            </template>

            <BatchDetailsModal v-else-if="batch" :batch="batch" @close="closeBatch" @product="openBatchProduct" @ship="shipBatch" />
        </div>
    </div>
</template>

<script>
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import StockOperationForm from '@/components/stock/StockOperationForm.vue'
import BatchDetailsModal from '@/components/stock/BatchDetailsModal.vue'
import { inventoryStore } from '@/services/inventoryStore'
import { PERMISSIONS } from '@/services/permissions'

export default {
    name: 'ScanProductView',
    components: { StockOperationForm, BatchDetailsModal },
    data() {
        return {
            store: inventoryStore,
            product: null,
            batch: null,
            operation: '',
            manualCode: '',
            error: '',
            method: 'camera',
            scanner: null,
            cameraError: '',
            scanned: false,
            readerId: `ims-inline-reader-${Math.random().toString(36).slice(2)}`,
            lookupCode: '',
        }
    },
    computed: {
        statusClass() {
            return `status-${this.store.productStatus(this.product).toLowerCase().replaceAll(' ', '-')}`
        },
        productMovements() {
            return this.store.state.movements
                .filter((item) => item.productId === this.product?.id)
                .slice()
                .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        },
        currentStock() {
            return this.product ? this.store.productStock(this.product.id) : 0
        },
        locationSummary() {
            if (!this.product) return 'Not assigned'
            const rows = this.store.productStockBreakdown(this.product.id)
            if (!rows.length) return 'Not assigned'

            const warehouses = [...new Set(rows.map((row) => row.warehouseId).filter(Boolean))]
            if (warehouses.length > 1) return `${warehouses.length} warehouses`

            const warehouseName = rows[0].warehouseName || 'Warehouse'
            const locations = [...new Set(rows.map((row) => row.location).filter(Boolean))]
            return locations.length ? `${warehouseName} · ${locations.join(', ')}` : warehouseName
        },
        trackingLabel() {
            return {
                none: 'Quantity',
                quantity: 'Quantity',
                batch: 'Expiry / lot',
                unit: 'Individual units',
            }[this.product?.trackingMode] || 'Quantity'
        },
        canReceive() {
            return this.store.can(PERMISSIONS.RECEIVE_STOCK)
        },
        canIssue() {
            return this.store.can(PERMISSIONS.ISSUE_STOCK) && this.currentStock > 0
        },
        canViewHistory() {
            return this.store.can(PERMISSIONS.VIEW_STOCK_HISTORY)
        },
        canPrint() {
            return this.store.can(PERMISSIONS.PRINT_LABELS)
        },
        scanReturnCode() {
            return String(this.lookupCode || this.product?.bar || this.product?.sku || this.batch?.id || '').trim()
        },
        scanContextQuery() {
            const query = {
                from: 'scan',
                code: this.scanReturnCode,
            }
            if (this.$route.query.from) query.scanFrom = String(this.$route.query.from)
            return query
        },
        historyRoute() {
            return {
                name: 'history',
                query: {
                    product: this.product?.sku || '',
                    ...this.scanContextQuery,
                },
            }
        },
        labelsRoute() {
            return {
                name: 'labels',
                query: {
                    product: this.product?.sku || '',
                    ...this.scanContextQuery,
                },
            }
        },
    },
    async mounted() {
        if (this.$route.query.code) {
            this.lookup(this.$route.query.code)
            return
        }
        await this.$nextTick()
        this.startCamera()
    },
    beforeUnmount() {
        this.stopScanner()
    },
    methods: {
        async setMethod(method) {
            if (method === this.method) return
            this.error = ''
            this.method = method
            if (method === 'camera') {
                await this.$nextTick()
                this.startCamera()
                return
            }
            await this.stopScanner()
        },
        submitManual() {
            if (!this.manualCode) return
            this.lookup(this.manualCode)
        },
        async startCamera() {
            if (this.product || this.batch || this.method !== 'camera') return
            await this.stopScanner()
            this.cameraError = ''
            this.scanned = false
            try {
                this.scanner = new Html5Qrcode(this.readerId, {
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                    ],
                    verbose: false,
                })
                await this.scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 260, height: 190 } },
                    this.onScan,
                    () => {},
                )
            } catch (error) {
                this.cameraError = 'Allow camera access or switch to Enter Code.'
            }
        },
        async onScan(value) {
            if (this.scanned) return
            this.scanned = true
            await this.stopScanner()
            this.lookup(value)
        },
        async stopScanner() {
            if (!this.scanner) return
            try {
                if (this.scanner.isScanning) await this.scanner.stop()
                this.scanner.clear()
            } catch (error) {
                // Camera stream may already be closed.
            }
            this.scanner = null
        },
        async resetScanner() {
            this.product = null
            this.batch = null
            this.operation = ''
            this.manualCode = ''
            this.error = ''
            this.method = 'camera'
            this.lookupCode = ''
            const query = {}
            if (this.$route.query.from) query.from = String(this.$route.query.from)
            await this.$router.replace({ name: 'scan', query })
            await this.$nextTick()
            this.startCamera()
        },
        lookup(value) {
            this.error = ''
            this.lookupCode = String(value || '').trim()
            const batch = this.store.findBatch(value)
            if (batch) {
                this.product = null
                this.batch = batch
                this.manualCode = ''
                return
            }
            const product = this.store.findProduct(value)
            if (!product) {
                this.product = null
                this.batch = null
                this.error = 'No product matches this code.'
                return
            }
            this.product = product
            this.batch = null
            this.manualCode = ''
            if (this.$route.query.action === 'in') {
                this.$router.replace({ name: 'receive', query: { product: product.sku, ...this.scanContextQuery } })
            } else if (this.$route.query.action === 'out') {
                this.operation = 'out'
            }
        },
        openBatchProduct(productId) {
            this.batch = null
            this.product = this.store.findProduct(productId)
            this.lookupCode = this.product?.bar || this.product?.sku || ''
        },
        shipBatch(batchOrId) {
            const batchId = typeof batchOrId === 'object' ? batchOrId?.id : batchOrId
            this.batch = null
            this.$router.push({ name: 'dispatch', query: { mode: 'ship', source: 'batch', batch: batchId, ...this.scanContextQuery } })
        },
        async closeBatch() {
            this.batch = null
            await this.$nextTick()
            this.startCamera()
        },
        goBack() {
            if (this.$route.query.from === 'dashboard') {
                this.$router.push({ name: 'dashboard' })
                return
            }
            this.$router.back()
        },
        openOperation(direction) {
            if (direction === 'in') {
                this.$router.push({
                    name: 'receive',
                    query: { product: this.product.sku, ...this.scanContextQuery },
                })
                return
            }
            this.operation = direction
        },
        completeOperation() {
            this.operation = ''
        },
        movementTone(movement) {
            if (this.store.isTransferMovement(movement)) return 'in'
            return movement?.changedQuantity > 0 ? 'in' : 'out'
        },
        movementIcon(movement) {
            if (this.store.isTransferMovement(movement)) return 'fa-right-left'
            return movement?.changedQuantity > 0
                ? 'fa-arrow-down'
                : 'fa-arrow-up'
        },
        movementQuantityClass(movement) {
            if (this.store.isTransferMovement(movement)) return ''
            return movement?.changedQuantity > 0 ? 'positive' : 'negative'
        },
        movementQuantityLabel(movement) {
            const quantity = this.store.movementQuantity(movement)
            const formatted = new Intl.NumberFormat('en-MY', {
                maximumFractionDigits: 2,
            }).format(quantity)
            if (this.store.isTransferMovement(movement)) return `${formatted} moved`
            return `${quantity > 0 ? '+' : ''}${formatted}`
        },
        formatQuantity(value) {
            return new Intl.NumberFormat('en-MY', {
                maximumFractionDigits: 2,
            }).format(Number(value) || 0)
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

<style scoped src="@/assets/css/pages/scan-product.css"></style>
