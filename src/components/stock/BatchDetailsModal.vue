<template>
    <Teleport to="body">
    <div class="modal-backdrop batch-details-backdrop" @click.self="$emit('close')">
        <section v-if="resolvedBatch" class="batch-details-modal" role="dialog" aria-modal="true" aria-label="Batch details">
            <header class="modal-header">
                <div><span class="eyebrow">BATCH DETAILS</span><h2>{{ resolvedBatch.name }}</h2><p class="mono">{{ resolvedBatch.id }}</p></div>
                <div class="batch-details-header-actions">
                    <button v-if="invoiceDocuments.length" class="icon-button" type="button" aria-label="View supplier invoice" title="View supplier invoice" @click="openReceipt"><i class="fa-solid fa-file-invoice"></i></button>
                    <button class="icon-button" type="button" aria-label="Print batch labels" @click="printBatchLabels"><i class="fa-solid fa-print"></i></button>
                    <button class="icon-button" type="button" aria-label="Edit batch recipe" @click="toggleRecipeEdit"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-button" type="button" aria-label="Close batch details" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </header>

            <div class="batch-details-body">
                <aside class="batch-details-identity">
                    <button class="batch-qr-card batch-barcode-card batch-barcode-button" type="button" aria-label="Enlarge batch barcode" @click="barcodeZoomOpen = true">
                        <img v-if="barcodeDataUrl" :src="barcodeDataUrl" alt="Batch barcode" />
                        <i v-else class="fa-solid fa-barcode"></i>
                    </button>
                    <strong class="mono">{{ resolvedBatch.id }}</strong>
                    <dl>
                        <div><dt>Products</dt><dd>{{ resolvedBatch.productCount }}</dd></div>
                        <div><dt>Available parts</dt><dd>{{ formatQuantity(resolvedBatch.availableQuantity) }}</dd></div>
                        <div><dt>Complete batches</dt><dd>{{ resolvedBatch.availableBatchCount }}</dd></div>
                        <div><dt>Received</dt><dd>{{ formatDate(resolvedBatch.receivedDate) }}</dd></div>
                    </dl>
                </aside>
                <section class="batch-parts-panel">
                    <div class="batch-detail-tabs" role="tablist" aria-label="Batch information">
                        <button type="button" :class="{ active: activeTab === 'parts' }" @click="activeTab = 'parts'"><i class="fa-solid fa-layer-group"></i>Parts <span>{{ resolvedBatch.items?.length || 0 }}</span></button>
                        <button type="button" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'"><i class="fa-solid fa-clock-rotate-left"></i>History <span>{{ batchHistory.length }}</span></button>
                    </div>
                    <header v-if="activeTab === 'parts'"><div><span class="eyebrow">PARTS</span><h3>Items under this batch</h3></div><strong>{{ resolvedBatch.availableQuantity }}</strong></header>

                    <div v-if="activeTab === 'parts' && editingRecipe" class="batch-recipe-editor">
                        <div class="batch-recipe-editor-list">
                            <label v-for="item in recipeDraft" :key="item.productId">
                                <span>{{ store.findProduct(item.productId)?.name || item.productId }}</span>
                                <input v-model.number="item.quantity" type="number" min="0.01" step="0.01" />
                                <small>{{ store.findProduct(item.productId)?.unit || '' }} / batch</small>
                                <button type="button" class="batch-recipe-remove" :aria-label="`Remove ${store.findProduct(item.productId)?.name || 'product'}`" @click="removeRecipeProduct(item.productId)"><i class="fa-solid fa-trash-can"></i></button>
                            </label>
                            <div v-if="recipeAddOpen" class="batch-recipe-add-row">
                                <ScrollableSelect v-model="recipeNewProductId"><option value="" disabled>Select product</option><option v-for="product in recipeProductOptions" :key="product.id" :value="product.id">{{ product.sku }} — {{ product.name }}</option></ScrollableSelect>
                                <button class="button primary" type="button" :disabled="!recipeNewProductId" @click="addRecipeProduct">Add</button>
                            </div>
                            <button v-else class="batch-recipe-add" type="button" @click="recipeAddOpen = true"><i class="fa-solid fa-plus"></i>Add product</button>
                        </div>
                        <div class="batch-recipe-actions"><button class="button secondary" type="button" @click="cancelRecipeEdit">Cancel</button><button class="button primary" type="button" @click="saveRecipe">Save recipe</button></div>
                    </div>
                    <div v-else-if="activeTab === 'parts'" class="batch-parts-list" role="region" aria-label="Batch item list" tabindex="0">
                        <article v-for="item in resolvedBatch.items" :key="item.lotId" class="batch-part-card">
                            <button
                                class="batch-part-toggle"
                                type="button"
                                :aria-expanded="item.units?.length ? itemExpanded(item.lotId) : undefined"
                                @click="item.units?.length ? toggleItem(item.lotId) : $emit('product', item.productId)"
                            >
                                <span class="batch-part-symbol">{{ initials(item.productName) }}</span>
                                <span class="batch-part-copy"><strong>{{ item.productName }}</strong><small class="mono">{{ item.sku }}</small><small>Per batch: {{ formatQuantity(item.recipeQuantity) }} {{ item.unit }}</small><small v-if="item.units?.length" class="batch-unit-count">Individual Units: {{ item.units.length }}</small></span>
                                <span class="batch-part-quantity"><strong>{{ formatQuantity(item.availableQuantity) }}</strong><small>{{ item.unit }}</small></span>
                                <span class="batch-part-locations"><span v-for="position in item.positions" :key="position.id"><i class="fa-solid fa-location-dot"></i>{{ position.locationName }} · {{ formatQuantity(position.quantity) }}</span></span>
                                <i class="fa-solid batch-part-chevron" :class="item.units?.length ? ['fa-chevron-right', { expanded: itemExpanded(item.lotId) }] : 'fa-arrow-up-right-from-square'"></i>
                            </button>

                            <div v-if="itemExpanded(item.lotId)" class="batch-unit-list">
                                <div class="batch-unit-head"><span>Item</span><span>Unit barcode</span><span>Location</span><span>Status</span></div>
                                <div v-for="unit in item.units" :key="unit.id || unit.code" class="batch-unit-row">
                                    <strong>{{ unitOrdinal(unit) }}/{{ unitTotal(unit, item) }}</strong>
                                    <span class="mono">{{ unit.code }}</span>
                                    <span>{{ unit.location || unit.locationName || '—' }}</span>
                                    <span class="batch-unit-status" :class="`status-${statusKey(unit.status)}`">{{ unitStatusLabel(unit.status) }}</span>
                                </div>
                                <div v-if="!item.units?.length" class="batch-unit-empty">No individual item records.</div>
                                <button class="batch-product-link" type="button" @click="$emit('product', item.productId)">
                                    View product details <i class="fa-solid fa-arrow-right"></i>
                                </button>
                            </div>
                        </article>
                    </div>
                    <div v-else class="batch-history-list">
                        <button v-for="movement in batchHistory" :key="movement.id" type="button" class="batch-history-row" :class="`tone-${batchHistoryTone(movement)}`" @click.stop="openMovement(movement)">
                            <span class="batch-history-icon" :class="batchHistoryTone(movement)"><i class="fa-solid" :class="batchHistoryIcon(movement)"></i></span>
                            <span class="batch-history-copy"><strong>{{ movement.reason || movement.type || 'Stock movement' }}</strong><small>{{ movement.productName || 'Batch item' }}<template v-if="batchHistoryLocation(movement)"> · {{ batchHistoryLocation(movement) }}</template></small></span>
                            <span class="batch-history-quantity" :class="`tone-${batchHistoryTone(movement)}`"><strong>{{ batchHistoryQuantity(movement) }} <em>{{ store.movementUnit(movement) }}</em></strong></span>
                            <span class="batch-history-time"><strong>{{ formatMovementDate(movement.createdAt) }}</strong><small>{{ formatMovementTime(movement.createdAt) }} · {{ movement.staffName || 'System' }}</small></span>
                            <i class="fa-solid fa-chevron-right batch-history-chevron" aria-hidden="true"></i>
                        </button>
                        <div v-if="!batchHistory.length" class="batch-history-empty"><i class="fa-solid fa-clock-rotate-left"></i><strong>No history</strong></div>
                    </div>
                </section>
            </div>
            <div v-if="selectedMovement" class="batch-movement-backdrop" @click.self="selectedMovement = null">
                <section class="batch-movement-record-modal" role="dialog" aria-modal="true" aria-label="Movement details">
                    <header class="batch-movement-record-header">
                        <div>
                            <span class="eyebrow">STOCK MOVEMENT</span>
                            <h2>{{ selectedMovement.type || 'Movement details' }}</h2>
                            <p class="mono">{{ selectedMovement.document || selectedMovement.id }}</p>
                        </div>
                        <div class="batch-movement-record-actions">
                            <button v-if="selectedMovementInvoice" class="icon-button" type="button" aria-label="View linked invoice" title="View invoice" @click="openSelectedMovementInvoice"><i class="fa-solid fa-file-invoice"></i></button>
                            <button class="icon-button" type="button" aria-label="Close movement details" @click="selectedMovement = null"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </header>
                    <div class="batch-movement-record-body">
                        <section class="batch-movement-record-grid">
                            <article><small>Product</small><strong>{{ selectedMovement.productName || 'Batch item' }}</strong><span class="mono">{{ selectedMovement.sku || selectedMovement.productId || '—' }}</span></article>
                            <article><small>{{ store.isTransferMovement(selectedMovement) ? 'Moved' : 'Change' }}</small><strong :class="batchHistoryTone(selectedMovement)">{{ batchHistoryQuantity(selectedMovement) }} {{ movementUnit(selectedMovement) }}</strong><span>{{ movementBalanceLabel(selectedMovement) }}</span></article>
                            <article><small>Reference</small><strong class="mono">{{ selectedMovement.reference || '—' }}</strong><span>{{ formatMovementDate(selectedMovement.createdAt) }}</span></article>
                            <article><small>{{ store.isTransferMovement(selectedMovement) ? 'Route' : 'Location' }}</small><strong>{{ movementLocation(selectedMovement) }}</strong><span class="mono">{{ selectedMovement.batch || selectedMovement.batchGroupId || resolvedBatch.id }}</span></article>
                        </section>
                        <dl class="batch-movement-record-facts">
                            <div><dt>Reason</dt><dd>{{ selectedMovement.reason || selectedMovement.type || '—' }}</dd></div>
                            <div><dt>Remark</dt><dd>{{ selectedMovement.remark || '—' }}</dd></div>
                            <div v-if="hasTransferBalances(selectedMovement)"><dt>Source balance</dt><dd>{{ transferSourceBalanceLabel(selectedMovement) }}</dd></div>
                            <div v-if="hasTransferBalances(selectedMovement)"><dt>Destination balance</dt><dd>{{ transferDestinationBalanceLabel(selectedMovement) }}</dd></div>
                            <div><dt>Units</dt><dd class="mono">{{ selectedMovement.unitCodes?.length ? selectedMovement.unitCodes.join(', ') : '—' }}</dd></div>
                            <div><dt>Operator</dt><dd>{{ selectedMovement.staffName || 'System' }}</dd></div>
                        </dl>
                        <img v-if="selectedMovement.photo" class="batch-movement-photo" :src="selectedMovement.photo" alt="Stock movement evidence" />
                    </div>
                </section>
            </div>

            <footer class="batch-details-actions">
                <button class="button secondary" type="button" @click="$emit('close')">Close</button>
                <button class="button secondary batch-stock-in-button" type="button" @click="receiveBatch"><i class="fa-solid fa-arrow-down"></i>Stock In</button>
                <button class="button primary" type="button" :disabled="!resolvedBatch.availableBatchCount" @click="$emit('ship', resolvedBatch)"><i class="fa-solid fa-truck-arrow-right"></i>Ship Batch</button>
            </footer>
        </section>
        <div v-if="barcodeZoomOpen" class="batch-barcode-preview-backdrop" @mousedown.self="barcodeZoomOpen = false">
            <section class="batch-barcode-preview" role="dialog" aria-modal="true" aria-label="Enlarged batch barcode">
                <button class="icon-button batch-barcode-preview-close" type="button" aria-label="Close barcode preview" @click="barcodeZoomOpen = false"><i class="fa-solid fa-xmark"></i></button>
                <span class="eyebrow">BATCH BARCODE</span>
                <img v-if="barcodeDataUrl" :src="barcodeDataUrl" alt="Enlarged batch barcode" />
                <i v-else class="fa-solid fa-barcode"></i>
                <strong class="mono">{{ resolvedBatch.id }}</strong>
            </section>
        </div>

        <SupplierReceiptModal
            v-if="selectedReceipt"
            :record="selectedReceipt"
            :supplier="receiptSupplier"
            :record-index="receiptIndex"
            :record-total="invoiceDocuments.length"
            @previous="stepReceipt(-1, true)"
            @next="stepReceipt(1, true)"
            @close="selectedReceipt = null"
        />
    </div>
    </Teleport>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'
import { barcodeDataUrl } from '@/utils/barcode'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'

export default {
    name: 'BatchDetailsModal',
    props: {
        batch: { type: Object, default: null },
        batchId: { type: String, default: '' },
    },
    components: { SupplierReceiptModal },
    emits: ['close', 'product', 'ship'],
    data() {
        return { store: inventoryStore, barcodeDataUrl: '', barcodeZoomOpen: false, expandedItems: {}, selectedReceipt: null, selectedMovement: null, receiptIndex: 0, activeTab: 'parts', editingRecipe: false, recipeDraft: [], recipeAddOpen: false, recipeNewProductId: '' }
    },
    computed: {
        resolvedBatch() {
            const id = this.batchId || this.batch?.id
            // Resolve from canonical state so edits made from Product Details
            // refresh this modal immediately instead of retaining a stale prop.
            return id ? this.store.findBatch(id) : this.batch
        },
        batchLotIds() {
            if (!this.resolvedBatch?.id) return new Set()
            return new Set(
                this.store.state.stockLots
                    .filter((lot) => String(lot.batchGroupId || '') === String(this.resolvedBatch.id))
                    .map((lot) => lot.id),
            )
        },
        batchReceiptCandidates() {
            if (!this.resolvedBatch?.id) return []
            const receiptIds = new Set(
                this.store.state.stockLots
                    .filter((lot) => this.batchLotIds.has(lot.id))
                    .map((lot) => lot.receiptId)
                    .filter(Boolean),
            )
            return this.store.state.receipts.filter((receipt) => {
                const linked = String(receipt.batchGroupId || '') === String(this.resolvedBatch.id) || receiptIds.has(receipt.id)
                return linked && receipt.stockInType === 'supplier' && Boolean(String(receipt.invoiceNumber || '').trim())
            })
        },
        invoiceDocuments() {
            const groups = new Map()
            this.batchReceiptCandidates.forEach((receipt) => {
                const key = [receipt.invoiceNumber || receipt.id, receipt.supplierId || '', receipt.receivedDate || ''].join('|')
                const rows = groups.get(key) || []
                rows.push(receipt)
                groups.set(key, rows)
            })
            return [...groups.values()]
                .sort((a, b) => String(b[0]?.createdAt || '').localeCompare(String(a[0]?.createdAt || '')))
                .map((rows) => this.receiptDocument(rows[0], rows))
        },
        currentInvoiceDocument() {
            if (!this.invoiceDocuments.length) return null
            const index = Math.min(Math.max(0, this.receiptIndex), this.invoiceDocuments.length - 1)
            return this.invoiceDocuments[index] || null
        },
        receiptSupplier() {
            const receipt = this.selectedReceipt || this.currentInvoiceDocument
            return receipt ? this.store.findSupplier(receipt.supplierId) || null : null
        },
        batchHistory() {
            if (!this.resolvedBatch?.id) return []
            const batchId = String(this.resolvedBatch.id)
            return this.store.state.movements
                .filter((movement) => {
                    const shipment = this.store.findShipmentForMovement(movement)
                    return (
                        String(movement.batchGroupId || '') === batchId ||
                        String(movement.batchId || movement.batch || '') === batchId ||
                        this.batchLotIds.has(movement.lotId) ||
                        String(shipment?.batchGroupId || '') === batchId
                    )
                })
                .slice()
                .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        },
        selectedMovementInvoice() {
            return this.store.findReceiptForMovement(this.selectedMovement, { invoiceOnly: true })
        },
        recipeProductOptions() {
            const selected = new Set(this.recipeDraft.map((item) => item.productId))
            return this.store.state.products.filter((product) => product.active && !selected.has(product.id))
        },
    },
    watch: {
        resolvedBatch: { immediate: true, handler() { this.makeBarcode(); this.barcodeZoomOpen = false; this.receiptIndex = 0; this.activeTab = 'parts'; this.selectedMovement = null } },
        invoiceDocuments(documents) { if (this.receiptIndex >= documents.length) this.receiptIndex = Math.max(0, documents.length - 1) },
    },
    methods: {
        initials(value) { return String(value || '').slice(0, 2).toUpperCase() },
        formatQuantity(value) { return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0) },
        formatDate(value) { return value ? new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '—' },
        itemExpanded(lotId) { return Boolean(this.expandedItems[lotId]) },
        toggleItem(lotId) { this.expandedItems = { ...this.expandedItems, [lotId]: !this.expandedItems[lotId] } },
        unitOrdinal(unit) { return Number(unit.displayOrdinal || unit.batchPartOrdinal || unit.ordinal || 0) || '—' },
        unitTotal(unit, item) { return Number(unit.displayTotal || unit.batchPartTotal || unit.receiptQuantity || item.units?.length || 0) || '—' },
        statusKey(status) { return String(status || 'available').toLowerCase().replaceAll('_', '-') },
        unitStatusLabel(status) { return String(status || 'available').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) },
        makeBarcode() {
            this.barcodeDataUrl = this.resolvedBatch
                ? barcodeDataUrl(this.resolvedBatch.id, { width: 2, height: 86, margin: 0, displayValue: false })
                : ''
        },
        receiptDocument(receipt, explicitReceipts = null) {
            if (!receipt) return null
            const siblings = explicitReceipts || this.batchReceiptCandidates.filter((item) => {
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
            if (!this.currentInvoiceDocument) return
            this.selectedReceipt = this.currentInvoiceDocument
        },
        stepReceipt(delta, keepOpen = false) {
            const total = this.invoiceDocuments.length
            if (total <= 1) return
            this.receiptIndex = (this.receiptIndex + delta + total) % total
            if (this.selectedReceipt || keepOpen) this.selectedReceipt = this.currentInvoiceDocument
        },
        openMovement(movement) {
            this.selectedReceipt = null
            this.selectedMovement = movement
        },
        openSelectedMovementInvoice() {
            const receipt = this.selectedMovementInvoice
            if (!receipt) return
            const document = this.receiptDocument(receipt)
            const index = this.invoiceDocuments.findIndex((item) => (
                String(item.invoiceNumber || '') === String(document.invoiceNumber || '') &&
                String(item.supplierId || '') === String(document.supplierId || '') &&
                String(item.receivedDate || '') === String(document.receivedDate || '')
            ))
            if (index >= 0) {
                this.receiptIndex = index
                this.selectedReceipt = this.currentInvoiceDocument
            } else {
                this.selectedReceipt = document
            }
        },
        movementLocation(movement) {
            return this.store.movementRoute(movement)
        },
        movementUnit(movement) {
            return this.store.movementUnit(movement) || ''
        },
        hasTransferBalances(movement) {
            if (!this.store.isTransferMovement(movement)) return false
            const balances = this.store.movementBalances(movement)
            return [balances.sourceBefore, balances.sourceAfter, balances.destinationBefore, balances.destinationAfter].every((value) => value !== null)
        },
        transferSourceBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            return `${this.formatQuantity(balances.sourceBefore)} → ${this.formatQuantity(balances.sourceAfter)} ${this.movementUnit(movement)}`
        },
        transferDestinationBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            return `${this.formatQuantity(balances.destinationBefore)} → ${this.formatQuantity(balances.destinationAfter)} ${this.movementUnit(movement)}`
        },
        movementBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            if (this.store.isTransferMovement(movement)) return `Total stock ${this.formatQuantity(balances.totalBefore)} → ${this.formatQuantity(balances.totalAfter)} (unchanged)`
            return `Total stock ${this.formatQuantity(balances.totalBefore)} → ${this.formatQuantity(balances.totalAfter)}`
        },
        batchHistoryTone(movement) {
            if (this.store.isTransferMovement(movement)) return 'transfer'
            if (Number(movement.changedQuantity) > 0) return 'in'
            if (Number(movement.changedQuantity) < 0) return 'out'
            return 'neutral'
        },
        batchHistoryIcon(movement) {
            if (this.store.isTransferMovement(movement)) return 'fa-right-left'
            if (movement.type === 'Label Print') return 'fa-print'
            if (movement.type === 'Shipment') return 'fa-truck-arrow-right'
            if (movement.type === 'Shipment Void') return 'fa-rotate-left'
            if (['Damage', 'Expired', 'Lost'].includes(movement.type)) return 'fa-triangle-exclamation'
            return Number(movement.changedQuantity) >= 0 ? 'fa-arrow-down' : 'fa-arrow-up'
        },
        batchHistoryQuantity(movement) {
            const quantity = this.store.movementQuantity(movement)
            if (this.store.isTransferMovement(movement)) return this.formatQuantity(quantity)
            return `${quantity > 0 ? '+' : ''}${this.formatQuantity(quantity)}`
        },
        batchHistoryLocation(movement) {
            return movement.location || movement.sourceLocationName || movement.destinationLocationName || ''
        },
        formatMovementDate(value) {
            if (!value) return '—'
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
        },
        formatMovementTime(value) {
            if (!value) return ''
            return new Intl.DateTimeFormat('en-MY', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
        },
        printBatchLabels() {
            if (!this.resolvedBatch?.id) return
            this.$emit('close')
            this.$router.push({ name: 'labels', query: { batch: this.resolvedBatch.id } })
        },
        receiveBatch() {
            if (!this.resolvedBatch?.id) return
            const batchId = this.resolvedBatch.id
            this.$emit('close')
            this.$router.push({ name: 'receive', query: { stockTarget: 'batch', batch: batchId } })
        },
        toggleRecipeEdit() {
            const recipes = new Map()
            ;(this.resolvedBatch?.items || []).forEach((item) => {
                if (!recipes.has(item.productId)) recipes.set(item.productId, { productId: item.productId, quantity: Number(item.recipeQuantity) || 1 })
            })
            this.recipeDraft = [...recipes.values()]
            this.recipeAddOpen = false
            this.recipeNewProductId = ''
            this.editingRecipe = !this.editingRecipe
        },
        cancelRecipeEdit() {
            this.editingRecipe = false
            this.recipeAddOpen = false
            this.recipeNewProductId = ''
        },
        addRecipeProduct() {
            if (!this.recipeNewProductId || this.recipeDraft.some((item) => item.productId === this.recipeNewProductId)) return
            this.recipeDraft.push({ productId: this.recipeNewProductId, quantity: 1 })
            this.recipeNewProductId = ''
            this.recipeAddOpen = false
        },
        removeRecipeProduct(productId) {
            if (this.recipeDraft.length <= 1) {
                this.store.addToast('A batch recipe needs at least one product.', 'error')
                return
            }
            this.recipeDraft = this.recipeDraft.filter((item) => item.productId !== productId)
        },
        saveRecipe() {
            try {
                this.store.updateBatchDefinition(this.resolvedBatch.id, { items: this.recipeDraft })
                this.editingRecipe = false
                this.store.addToast(`${this.resolvedBatch.id} recipe updated.`)
            } catch (error) {
                this.store.addToast(error.message, 'error')
            }
        },
    },
}
</script>

<style scoped src="@/assets/css/components/batch-details-modal.css"></style>
