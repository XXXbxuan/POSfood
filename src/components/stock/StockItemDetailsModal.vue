<template>
    <div class="modal-backdrop" @click.self="$emit('close')">
        <section class="stock-item-modal" role="dialog" aria-modal="true" aria-label="Product stock details">
            <header class="modal-header">
                <div><span class="eyebrow">PRODUCT STOCK</span><h2>{{ product.name }}</h2><p class="mono">{{ product.sku }}</p></div>
                <div class="stock-item-header-actions">
                    <button v-if="relatedReceipt" class="icon-button" type="button" aria-label="View supplier invoice" @click="openReceipt"><i class="fa-solid fa-file-invoice"></i></button>
                    <button class="icon-button" type="button" aria-label="Close product stock details" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </header>

            <div class="stock-item-body">
                <aside class="stock-item-identity">
                    <button class="stock-item-barcode-card" type="button" aria-label="Enlarge barcode" @click="barcodeZoomOpen = true">
                        <img v-if="barcodeDataUrl" :src="barcodeDataUrl" :alt="`${product.name} barcode`" />
                        <i v-else class="fa-solid fa-barcode"></i>
                    </button>
                    <strong class="mono">{{ product.bar || product.sku }}</strong>
                    <dl>
                        <div><dt>Available</dt><dd>{{ formatQuantity(stock.availableQuantity) }} {{ product.unit }}</dd></div>
                        <div><dt>Receipts</dt><dd>{{ receiptLayers.length }}</dd></div>
                        <div><dt>Location</dt><dd>{{ stock.locationName || stock.location || '—' }}</dd></div>
                    </dl>
                </aside>

                <section class="stock-item-panel">
                    <header>
                        <div><span class="eyebrow">{{ product.trackingMode === 'unit' ? 'UNITS' : 'PRODUCT' }}</span><h3>{{ product.trackingMode === 'unit' ? 'Individually coded items' : 'Stock at this location' }}</h3></div>
                        <strong>{{ product.trackingMode === 'unit' ? units.length : formatQuantity(stock.availableQuantity) }}</strong>
                    </header>

                    <div v-if="product.trackingMode === 'unit'" class="stock-unit-table">
                        <div class="stock-unit-head"><span>Item</span><span>Unit barcode</span><span>Status</span></div>
                        <div v-for="unit in units" :key="unit.id" class="stock-unit-row">
                            <strong>{{ unitOrdinal(unit) }}/{{ unitTotal(unit) }}</strong>
                            <span class="mono">{{ unit.code }}</span>
                            <span class="stock-unit-status" :class="`status-${statusKey(unit.status)}`">{{ statusLabel(unit.status) }}</span>
                        </div>
                        <div v-if="!units.length" class="stock-item-empty">No unit records available.</div>
                    </div>

                    <div v-else class="stock-receipt-layers">
                        <header><span>Receipt layer</span><span>Received</span><span>Expiry</span><span>Available</span></header>
                        <article v-for="receipt in receiptLayers" :key="receipt.id">
                            <strong class="mono">{{ receipt.layerCode || '—' }}</strong>
                            <span>{{ formatDate(receipt.receivedDate || receipt.receivedAt) }}</span>
                            <span :class="{ expired: isExpired(receipt) }">{{ receipt.expiryDate ? formatDate(receipt.expiryDate) : 'Not tracked' }}</span>
                            <strong>{{ formatQuantity(receipt.availableQuantity) }} {{ product.unit }}</strong>
                        </article>
                        <div v-if="!receiptLayers.length" class="stock-item-empty">No receipt layers available.</div>
                    </div>
                </section>
            </div>

            <footer class="stock-item-actions">
                <button class="button secondary" type="button" @click="$emit('close')">Close</button>
                <div class="stock-item-action-group">
                    <button class="button stock-item-in-button" type="button" @click="$emit('receive', stock)"><i class="fa-solid fa-arrow-down"></i>Stock In</button>
                    <button class="button primary" type="button" :disabled="!Number(stock.availableQuantity)" @click="$emit('ship', stock)"><i class="fa-solid fa-truck-arrow-right"></i>Ship Product</button>
                </div>
            </footer>
        </section>
        <Teleport to="body">
            <div v-if="barcodeZoomOpen" class="stock-item-barcode-preview-backdrop" @mousedown.self="barcodeZoomOpen = false">
                <section class="stock-item-barcode-preview" role="dialog" aria-modal="true" aria-label="Enlarged product barcode">
                    <button class="icon-button" type="button" aria-label="Close barcode" @click="barcodeZoomOpen = false"><i class="fa-solid fa-xmark"></i></button>
                    <img v-if="barcodeDataUrl" :src="barcodeDataUrl" :alt="`${product.name} enlarged barcode`" />
                    <i v-else class="fa-solid fa-barcode"></i>
                    <div><strong>{{ product.name }}</strong><span class="mono">{{ product.bar || product.sku }}</span></div>
                </section>
            </div>
        </Teleport>

        <SupplierReceiptModal
            v-if="selectedReceipt"
            :record="selectedReceipt"
            :supplier="receiptSupplier"
            @close="selectedReceipt = null"
        />
    </div>
</template>

<script>
import { barcodeDataUrl } from '@/utils/barcode'
import { inventoryStore } from '@/services/inventoryStore'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'

export default {
    name: 'StockItemDetailsModal',
    components: { SupplierReceiptModal },
    props: {
        product: { type: Object, required: true },
        stock: { type: Object, required: true },
    },
    emits: ['close', 'receive', 'ship'],
    data() {
        return { store: inventoryStore, barcodeDataUrl: '', selectedReceipt: null, barcodeZoomOpen: false }
    },
    computed: {
        units() {
            return (this.stock.units || []).slice().sort(
                (left, right) => Number(left.ordinal || 0) - Number(right.ordinal || 0),
            )
        },
        receiptLayers() {
            return (this.stock.receipts || []).slice().sort((left, right) => {
                const leftExpiry = left.expiryDate || '9999-12-31'
                const rightExpiry = right.expiryDate || '9999-12-31'
                return leftExpiry.localeCompare(rightExpiry) || String(left.receivedDate || left.receivedAt || '').localeCompare(String(right.receivedDate || right.receivedAt || ''))
            })
        },
        relatedReceipt() {
            return this.store.findReceiptForStock(this.product.id, this.stock, { invoiceOnly: true })
        },
        receiptSupplier() {
            return this.relatedReceipt ? this.store.findSupplier(this.relatedReceipt.supplierId) || null : null
        },
    },
    watch: {
        product: { immediate: true, handler() { this.makeBarcode() } },
    },
    methods: {
        initials(value) { return String(value || '').slice(0, 2).toUpperCase() },
        formatQuantity(value) { return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0) },
        formatDate(value) {
            if (!value) return '—'
            const date = new Date(value)
            return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
        },
        formatDateTime(value) {
            if (!value) return '—'
            const date = new Date(value)
            return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
        },
        unitOrdinal(unit) { return Number(unit.displayOrdinal || unit.batchOrdinal || unit.ordinal || 0) || '—' },
        unitTotal(unit) { return Number(unit.displayTotal || unit.receiptQuantity || this.units.length || 0) || '—' },
        isExpired(receipt) { return Boolean(receipt?.expiryDate && receipt.expiryDate < new Date().toISOString().slice(0, 10)) },
        statusKey(status) { return String(status || 'available').toLowerCase().replaceAll('_', '-') },
        statusLabel(status) { return String(status || 'available').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) },
        receiptDocument(receipt) {
            if (!receipt) return null
            const siblings = this.store.state.receipts.filter((item) => {
                if (receipt.batchGroupId) return item.batchGroupId === receipt.batchGroupId && item.supplierId === receipt.supplierId
                if (receipt.invoiceNumber) return item.invoiceNumber === receipt.invoiceNumber && item.supplierId === receipt.supplierId && item.receivedDate === receipt.receivedDate
                return item.id === receipt.id
            })
            const receipts = siblings.length ? siblings : [receipt]
            return {
                ...receipt,
                receiptIds: receipts.map((item) => item.receiptNumber || item.id),
                lines: receipts.flatMap((item) => (item.lines || []).map((line) => ({ ...line, receiptId: item.id }))),
                companyName: 'Inventory Workspace',
                companyDetails: receipt.warehouseName || 'Main Warehouse',
            }
        },
        openReceipt() {
            if (!this.relatedReceipt) return
            this.selectedReceipt = this.receiptDocument(this.relatedReceipt)
        },
        makeBarcode() {
            const code = String(this.product.bar || this.product.sku || '').trim()
            this.barcodeDataUrl = code ? barcodeDataUrl(code, { width: 2, height: 86, margin: 0, displayValue: false }) : ''
        },
    },
}
</script>

<style scoped src="@/assets/css/components/stock-item-details-modal.css"></style>
