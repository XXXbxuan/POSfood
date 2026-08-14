<template>
    <div class="page-stack history-page">
        <section class="page-heading">
            <div class="page-title-row">
                <button v-if="canReturnToSource" class="page-back-link" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <h1 class="inventory-page-title">Stock History</h1>
            </div>
        </section>

        <section class="history-summary">
            <article><span class="stock-in"><i class="fa-solid fa-arrow-down"></i></span><div><small>Total Stock In</small><strong>+{{ totals.stockIn }}</strong></div></article>
            <article><span class="stock-out"><i class="fa-solid fa-arrow-up"></i></span><div><small>Total Stock Out</small><strong>-{{ totals.stockOut }}</strong></div></article>
            <article><span class="neutral"><i class="fa-solid fa-list-check"></i></span><div><small>Movements</small><strong>{{ filteredMovements.length }}</strong></div></article>
            <article class="history-action-card">
                <button type="button" @click="print"><i class="fa-solid fa-print"></i>Print</button>
                <button type="button" @click="openFilters"><i class="fa-solid fa-sliders"></i>Filter<span v-if="activeFilterCount">{{ activeFilterCount }}</span></button>
            </article>
        </section>

        <section class="panel table-panel history-table-panel">
            <div ref="historyTableScroll" class="table-scroll">
                <table class="inventory-table history-table history-table-summary">
                    <thead><tr><th>Movement</th><th class="history-product-column">Product</th><th>Change</th><th>Date & Time</th><th aria-label="Details"></th></tr></thead>
                    <tbody>
                        <tr
                            v-for="item in pagedFilteredMovements"
                            :key="item.id"
                            :class="['history-clickable-row', `history-row-${historyRowTone(item)}`]"
                            tabindex="0"
                            @click="openMovement(item)"
                            @keydown.enter.prevent="openMovement(item)"
                            @keydown.space.prevent="openMovement(item)"
                        >
                            <td><span class="movement-type" :class="movementTone(item)"><i class="fa-solid" :class="movementIcon(item)"></i>{{ movementLabel(item) }}</span></td>
                            <td class="history-product-column"><strong>{{ item.productName }}</strong></td>
                            <td><strong class="change-quantity" :class="changeClass(item)">{{ movementQuantityLabel(item) }}</strong></td>
                            <td><strong>{{ formattedDate(item.createdAt) }}</strong><small>{{ formattedTime(item.createdAt) }}</small></td>
                            <td class="history-row-arrow"><i class="fa-solid fa-chevron-right"></i></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!filteredMovements.length" class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><strong>No movements found</strong></div>
            <footer v-if="filteredMovements.length" class="history-pagination">
                <button type="button" class="history-pagination-nav" aria-label="Previous page" :disabled="historyPage <= 1" @click="goToHistoryPage(historyPage - 1)"><i class="fa-solid fa-chevron-left"></i></button>
                <button
                    v-for="(page, index) in historyPaginationItems"
                    :key="`history-page-${String(page)}-${index}`"
                    type="button"
                    class="history-pagination-page"
                    :class="{ active: page === historyPage, ellipsis: typeof page !== 'number' }"
                    @click="goToHistoryPage(page)"
                >{{ paginationLabel(page) }}</button>
                <button type="button" class="history-pagination-nav" aria-label="Next page" :disabled="historyPage >= historyPageCount" @click="goToHistoryPage(historyPage + 1)"><i class="fa-solid fa-chevron-right"></i></button>
            </footer>
        </section>

        <section class="history-print-report" aria-hidden="true">
            <header class="history-print-header">
                <div class="history-print-brand">
                    <span><i class="fa-solid fa-boxes-stacked"></i></span>
                    <div><strong>INVENTORY</strong><small>MANAGEMENT SYSTEM</small></div>
                </div>
                <div class="history-print-title">
                    <span>ALL WAREHOUSES</span>
                    <h1>Stock Movement Report</h1>
                </div>
                <dl>
                    <div><dt>Printed</dt><dd>{{ reportPrintedAt }}</dd></div>
                    <div><dt>Records</dt><dd>{{ filteredMovements.length }}</dd></div>
                </dl>
            </header>

            <section class="history-print-criteria">
                <strong>Report criteria</strong>
                <span v-for="criterion in reportCriteria" :key="criterion">{{ criterion }}</span>
            </section>

            <section class="history-print-summary">
                <article><small>Total Stock In</small><strong class="positive">+{{ totals.stockIn }}</strong></article>
                <article><small>Total Stock Out</small><strong class="negative">-{{ totals.stockOut }}</strong></article>
                <article><small>Total Movements</small><strong>{{ filteredMovements.length }}</strong></article>
            </section>

            <table class="history-print-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Movement</th>
                        <th>Product</th>
                        <th>Batch / Location</th>
                        <th class="number">Before</th>
                        <th class="number">Change</th>
                        <th class="number">After</th>
                        <th>Reason / Reference</th>
                        <th>Operator</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in filteredMovements" :key="`print-${item.id}`">
                        <td><strong>{{ formattedDate(item.createdAt) }}</strong><small>{{ formattedTime(item.createdAt) }}</small></td>
                        <td><strong>{{ item.type }}</strong><small class="mono">{{ item.id }}</small></td>
                        <td><strong>{{ item.productName }}</strong><small class="mono">{{ item.sku }}</small></td>
                        <td><strong class="mono">{{ item.batch || '—' }}</strong><small>{{ movementRoute(item) }}</small></td>
                        <td class="number">{{ movementBeforeQuantity(item) }}</td>
                        <td class="number"><strong :class="changeClass(item)">{{ movementQuantityLabel(item) }}</strong></td>
                        <td class="number">{{ movementAfterQuantity(item) }}</td>
                        <td><strong>{{ item.reason || '—' }}</strong><small class="mono">{{ item.reference || 'No reference' }}</small></td>
                        <td><strong>{{ item.staffName || 'System' }}</strong><small class="mono">{{ item.staffId || 'SYSTEM' }}</small></td>
                    </tr>
                    <tr v-if="!filteredMovements.length">
                        <td colspan="9" class="history-print-empty">No movements match the selected criteria.</td>
                    </tr>
                </tbody>
            </table>

            <footer class="history-print-footer">
                <span>Inventory Management System · All Warehouses</span>
                <span class="history-print-page-number"></span>
            </footer>
        </section>

        <div v-if="selectedMovement" class="modal-backdrop" @click.self="selectedMovement = null">
            <section class="form-modal history-detail-modal">
                <header class="modal-header">
                    <div><span class="eyebrow">STOCK MOVEMENT</span><h2>Movement details</h2></div>
                    <div class="history-detail-header-actions">
                        <button
                            v-if="selectedMovementInvoice"
                            class="icon-button"
                            type="button"
                            aria-label="View linked invoice"
                            title="View invoice"
                            @click="openSelectedMovementInvoice"
                        >
                            <i class="fa-solid fa-file-invoice"></i>
                        </button>
                        <button class="icon-button" type="button" aria-label="Close" @click="selectedMovement = null">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>

                <div class="history-detail-overview">
                    <span class="history-detail-direction" :class="movementTone(selectedMovement)">
                        <i class="fa-solid" :class="movementIcon(selectedMovement)"></i>
                    </span>
                    <div class="history-detail-quantity">
                        <template v-if="selectedMovementShipmentContext?.isBatchShipment">
                            <small>BATCH SHIPMENT</small>
                            <strong class="history-detail-change neutral-change">{{ selectedMovementShipmentContext.batchId || selectedMovement.batch || 'Batch' }} · {{ formatQuantity(selectedMovementShipmentContext.batchCount) }} sets</strong>
                            <small>This item: {{ movementQuantityLabel(selectedMovement) }} {{ movementUnit(selectedMovement) }}</small>
                        </template>
                        <template v-else>
                            <small>{{ movementLabel(selectedMovement) }}</small>
                            <strong class="history-detail-change" :class="changeClass(selectedMovement)">{{ movementQuantityLabel(selectedMovement) }}</strong>
                            <small v-if="movementUnit(selectedMovement)">{{ movementUnit(selectedMovement) }}</small>
                        </template>
                    </div>
                    <div><strong>{{ formattedDate(selectedMovement.createdAt) }}</strong><small>{{ formattedTime(selectedMovement.createdAt) }}</small></div>
                </div>

                <div class="history-detail-content">
                    <section class="history-detail-section history-product-section">
                        <div class="history-detail-section-title">
                            <span><i class="fa-solid fa-box"></i></span>
                            <div><small>PRODUCT</small><h3>{{ selectedMovement.productName }}</h3></div>
                        </div>
                        <dl class="history-detail-facts">
                            <div><dt>Product code</dt><dd class="mono">{{ selectedMovement.sku }}</dd></div>
                            <div><dt>Batch</dt><dd class="mono">{{ selectedMovementShipmentContext?.batchId || selectedMovement.batch || '—' }}</dd></div>
                            <div><dt>{{ isTransferMovement(selectedMovement) ? 'Route' : 'Source' }}</dt><dd>{{ movementSourceLabel(selectedMovement) }}</dd></div>
                            <div v-if="selectedMovementShipmentContext?.recipeQuantity != null"><dt>Per set at shipment</dt><dd>{{ formatQuantity(selectedMovementShipmentContext.recipeQuantity) }} {{ movementUnit(selectedMovement) }}</dd></div>
                            <div v-if="selectedMovementShipmentContext"><dt>Shipped this item</dt><dd>{{ formatQuantity(Math.abs(Number(selectedMovement.changedQuantity || 0))) }} {{ movementUnit(selectedMovement) }}</dd></div>
                            <div><dt>Movement ID</dt><dd class="mono">{{ selectedMovement.id }}</dd></div>
                            <div v-if="selectedMovementShipmentContext?.batchShipmentId"><dt>Batch shipment</dt><dd class="mono">{{ selectedMovementShipmentContext.batchShipmentId }}</dd></div>
                            <div v-if="movementDocument(selectedMovement)"><dt>{{ selectedMovementShipmentContext?.batchShipmentId ? 'Shipment line' : 'Document' }}</dt><dd class="mono">{{ movementDocument(selectedMovement) }}</dd></div>
                            <div v-if="selectedMovement.unitCodes?.length"><dt>Units</dt><dd class="mono">{{ selectedMovement.unitCodes.join(', ') }}</dd></div>
                        </dl>
                    </section>

                    <section class="history-detail-section history-change-section">
                        <div class="history-detail-section-title">
                            <span><i class="fa-solid fa-arrow-right-arrow-left"></i></span>
                            <div><small>{{ selectedMovementShipmentContext ? 'SOURCE STOCK' : (isTransferMovement(selectedMovement) ? 'STOCK MOVEMENT' : 'STOCK CHANGE') }}</small><h3>{{ selectedMovementShipmentContext?.isBatchShipment ? 'Batch shipment' : selectedMovement.reason }}</h3></div>
                        </div>
                        <div class="history-stock-flow">
                            <div><small>{{ movementBalanceScope(selectedMovement) }} before</small><strong>{{ movementDisplayBefore(selectedMovement) }}</strong></div>
                            <i class="fa-solid fa-arrow-right"></i>
                            <div><small>{{ movementBalanceScope(selectedMovement) }} after</small><strong>{{ movementDisplayAfter(selectedMovement) }}</strong></div>
                        </div>
                        <dl class="history-detail-inline-facts">
                            <div v-if="selectedMovementShipmentContext?.recipient"><dt>Recipient</dt><dd>{{ selectedMovementShipmentContext.recipient }}</dd></div>
                            <div><dt>Reference</dt><dd class="mono">{{ selectedMovementShipmentContext?.reference || selectedMovement.reference || '—' }}</dd></div>
                            <div v-if="hasTransferBalances(selectedMovement)"><dt>Source balance</dt><dd>{{ transferSourceBalanceLabel(selectedMovement) }}</dd></div>
                            <div v-if="hasTransferBalances(selectedMovement)"><dt>Destination balance</dt><dd>{{ transferDestinationBalanceLabel(selectedMovement) }}</dd></div>
                            <div v-if="selectedMovement.remark"><dt>Remark</dt><dd>{{ selectedMovement.remark }}</dd></div>
                        </dl>
                    </section>

                    <button
                        v-if="hasProofRecord(selectedMovement)"
                        class="history-proof-card"
                        type="button"
                        @click="evidenceOpen = true"
                    >
                        <span class="history-proof-card-icon"><i class="fa-solid fa-camera"></i></span>
                        <span class="history-proof-card-copy">
                            <small>STOCK PROOF</small>
                            <strong>Reason &amp; photo record</strong>
                        </span>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                    </button>

                </div>

                <footer class="history-detail-actions">
                    <section class="history-operator-minimal" aria-label="Operator">
                        <span><i class="fa-solid fa-user"></i></span>
                        <strong>{{ selectedMovement.staffName }}</strong>
                    </section>
                    <button class="button primary" type="button" @click="selectedMovement = null">Done</button>
                </footer>
            </section>
        </div>

        <div v-if="selectedMovement && evidenceOpen" class="modal-backdrop history-proof-backdrop" @click.self="evidenceOpen = false">
            <section class="form-modal history-proof-modal" role="dialog" aria-modal="true" aria-label="Stock proof">
                <header class="modal-header">
                    <div><span class="eyebrow">STOCK PROOF</span><h2>Reason &amp; evidence</h2></div>
                    <button class="icon-button" type="button" aria-label="Close proof" @click="evidenceOpen = false"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="history-proof-content">
                    <section class="history-proof-media">
                        <img v-if="selectedMovement.photo" :src="selectedMovement.photo" alt="Stock movement evidence" />
                        <div v-else class="history-proof-empty-photo"><i class="fa-solid fa-camera"></i><span>No photo captured</span></div>
                        <dl>
                            <div><dt>Recorded</dt><dd>{{ formattedDate(selectedMovement.createdAt) }} · {{ formattedTime(selectedMovement.createdAt) }}</dd></div>
                            <div><dt>Movement</dt><dd class="mono">{{ selectedMovement.id }}</dd></div>
                        </dl>
                    </section>
                    <section class="history-proof-reason">
                        <span class="eyebrow">REASON</span>
                        <h3>{{ selectedMovement.reason || movementLabel(selectedMovement) }}</h3>
                        <dl>
                            <div><dt>{{ isTransferMovement(selectedMovement) ? 'Moved' : 'Change' }}</dt><dd :class="changeClass(selectedMovement)">{{ movementQuantityLabel(selectedMovement) }} {{ movementUnit(selectedMovement) }}</dd></div>
                            <div><dt>Reference</dt><dd class="mono">{{ selectedMovement.reference || '—' }}</dd></div>
                            <div><dt>Remark</dt><dd>{{ selectedMovement.remark || 'No additional remark.' }}</dd></div>
                            <div><dt>Operator</dt><dd>{{ selectedMovement.staffName || 'System' }}</dd></div>
                        </dl>
                    </section>
                </div>
            </section>
        </div>

        <div v-if="filterOpen" class="modal-backdrop" @click.self="filterOpen = false">
            <section class="form-modal history-filter-modal">
                <header class="modal-header">
                    <div><span class="eyebrow">STOCK HISTORY</span><h2>Filter records</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="filterOpen = false"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <form class="form-grid two-column" @submit.prevent="applyFilters">
                    <label class="full"><span>Search</span><input v-model.trim="filterDraft.search" type="search" autofocus placeholder="Product, movement or reference" /></label>
                    <label><span>Movement</span><ScrollableSelect v-model="filterDraft.type"><option value="">All movements</option><option v-for="item in movementTypes" :key="item">{{ item }}</option></ScrollableSelect></label>
                    <label><span>Staff</span><ScrollableSelect v-model="filterDraft.staff"><option value="">All staff</option><option v-for="item in staffNames" :key="item">{{ item }}</option></ScrollableSelect></label>
                    <label class="full"><span>Date</span><input v-model="filterDraft.date" type="date" /></label>
                    <footer class="history-filter-actions full">
                        <button class="button secondary" type="button" @click="clearDraft">Clear</button>
                        <span></span>
                        <button class="button primary" type="submit">Apply Filter</button>
                    </footer>
                </form>
            </section>
        </div>
        <SupplierReceiptModal v-if="selectedReceipt" :record="selectedReceipt" :supplier="receiptSupplier" @close="selectedReceipt = null" />
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'
import { paginationItems, paginationLabel } from '@/utils/pagination'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'

export default {
    name: 'HistoryView',
    components: { SupplierReceiptModal },
    data() {
        return {
            store: inventoryStore,
            search: this.$route.query.product || '',
            type: '',
            staff: '',
            date: '',
            filterOpen: false,
            selectedMovement: null,
            selectedReceipt: null,
            receiptSupplier: null,
            evidenceOpen: false,
            printGeneratedAt: new Date(),
            filterDraft: { search: '', type: '', staff: '', date: '' },
            historyPage: 1,
        }
    },
    computed: {
        staffNames() {
            return [...new Set(this.store.state.movements.map((item) => item.staffName))].sort()
        },
        movementTypes() {
            return [...new Set(this.store.state.movements.map((item) => item.type).filter(Boolean))].sort()
        },
        filteredMovements() {
            const search = this.search.toLowerCase()
            return this.store.state.movements.filter((item) => {
                const matchesSearch =
                    !search ||
                    [item.productName, item.sku, item.id, item.reference, item.batch].some((value) =>
                        String(value || '').toLowerCase().includes(search),
                    )
                return matchesSearch && (!this.type || item.type === this.type) && (!this.staff || item.staffName === this.staff) && (!this.date || item.createdAt.startsWith(this.date))
            })
        },
        historyPageCount() {
            return Math.max(1, Math.ceil(this.filteredMovements.length / 5))
        },
        historyPaginationItems() {
            return paginationItems(this.historyPage, this.historyPageCount)
        },
        pagedFilteredMovements() {
            const start = (this.historyPage - 1) * 5
            return this.filteredMovements.slice(start, start + 5)
        },
        selectedMovementInvoice() {
            return this.store.findReceiptForMovement(this.selectedMovement, { invoiceOnly: true })
        },
        selectedMovementShipmentContext() {
            return this.store.shipmentMovementContext(this.selectedMovement)
        },
        totals() {
            return {
                stockIn: this.filteredMovements.filter((item) => item.changedQuantity > 0).reduce((sum, item) => sum + item.changedQuantity, 0),
                stockOut: Math.abs(this.filteredMovements.filter((item) => item.changedQuantity < 0).reduce((sum, item) => sum + item.changedQuantity, 0)),
            }
        },
        activeFilterCount() {
            return [this.search, this.type, this.staff, this.date].filter(Boolean).length
        },
        reportPrintedAt() {
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(this.printGeneratedAt)
        },
        canReturnToSource() {
            return ['dashboard', 'scan'].includes(String(this.$route.query.from || ''))
        },
        reportCriteria() {
            const criteria = [
                this.date ? `Date: ${this.formattedDate(`${this.date}T00:00:00`)}` : 'Date: All recorded dates',
                this.type ? `Movement: ${this.type}` : 'Movement: All',
                this.staff ? `Operator: ${this.staff}` : 'Operator: All staff',
            ]
            if (this.search) criteria.push(`Search: ${this.search}`)
            return criteria
        },
    },
    watch: {
        search() { this.historyPage = 1 },
        type() { this.historyPage = 1 },
        staff() { this.historyPage = 1 },
        date() { this.historyPage = 1 },
        filteredMovements() {
            if (this.historyPage > this.historyPageCount) this.historyPage = this.historyPageCount
        },
    },
    methods: {
        paginationLabel,
        goToHistoryPage(page) {
            if (typeof page !== 'number' || !Number.isFinite(page)) return
            const nextPage = Math.min(this.historyPageCount, Math.max(1, Math.trunc(page)))
            if (nextPage === this.historyPage) return

            this.historyPage = nextPage
            this.$nextTick(() => {
                if (this.$refs.historyTableScroll) this.$refs.historyTableScroll.scrollTop = 0
            })
        },
        openMovement(item) {
            this.selectedReceipt = null
            this.receiptSupplier = null
            this.evidenceOpen = false
            this.selectedMovement = item
        },
        openSelectedMovementInvoice() {
            const receipt = this.selectedMovementInvoice
            if (!receipt) return
            this.selectedReceipt = this.receiptDocument(receipt)
            this.receiptSupplier = this.store.findSupplier(receipt.supplierId) || null
        },
        receiptForMovement(movement, options = {}) {
            return this.store.findReceiptForMovement(movement, options)
        },
        receiptDocument(receipt) {
            const siblings = this.store.state.receipts.filter((item) => {
                if (receipt.batchGroupId) return item.batchGroupId === receipt.batchGroupId && item.supplierId === receipt.supplierId
                if (receipt.invoiceNumber) return item.invoiceNumber === receipt.invoiceNumber && item.supplierId === receipt.supplierId && item.receivedDate === receipt.receivedDate
                return item.id === receipt.id
            })
            const receipts = siblings.length ? siblings : [receipt]
            return {
                ...receipt,
                receiptIds: receipts.map((item) => item.receiptNumber || item.id),
                lines: receipts.flatMap((item) => item.lines || []),
                companyName: 'Inventory Workspace',
                companyDetails: receipt.warehouseName || 'Main Warehouse',
            }
        },
        hasProofRecord(item) {
            return this.store.movementQuantity(item) !== 0 || Boolean(
                item?.photo || item?.remark || item?.reference,
            )
        },
        isTransferMovement(item) {
            return this.store.isTransferMovement(item)
        },
        movementLabel(item) {
            return item.type || (item.changedQuantity > 0 ? 'Stock In' : 'Stock Out')
        },
        movementTone(item) {
            if (this.isTransferMovement(item) || item.type === 'Label Print') return 'transfer'
            if (['Damage', 'Expired', 'Lost'].includes(item.type)) return 'warning'
            return item.changedQuantity > 0 ? 'in' : 'out'
        },
        movementIcon(item) {
            if (this.isTransferMovement(item)) return 'fa-right-left'
            if (item.type === 'Label Print') return 'fa-print'
            if (item.type === 'Shipment') return 'fa-truck-arrow-right'
            if (item.type === 'Shipment Void') return 'fa-rotate-left'
            if (['Count Gain', 'Count Loss'].includes(item.type)) return 'fa-list-check'
            if (item.type === 'Damage') return 'fa-triangle-exclamation'
            if (item.type === 'Expired') return 'fa-calendar-xmark'
            if (item.type === 'Lost') return 'fa-circle-question'
            return item.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'
        },
        historyRowTone(item) {
            if (item.type === 'Label Print') return 'label'
            if (item.type === 'Damage') return 'damage'
            if (this.isTransferMovement(item)) return 'transfer'
            if (Number(item.changedQuantity) > 0) return 'in'
            if (Number(item.changedQuantity) < 0) return 'out'
            return 'neutral'
        },
        changeClass(item) {
            if (this.isTransferMovement(item)) return 'neutral-change'
            if (item.changedQuantity > 0) return 'positive'
            if (item.changedQuantity < 0) return 'negative'
            return 'neutral-change'
        },
        movementQuantityLabel(item) {
            const quantity = this.store.movementQuantity(item)
            if (this.isTransferMovement(item)) return this.formatQuantity(quantity)
            return `${quantity > 0 ? '+' : ''}${this.formatQuantity(quantity)}`
        },
        movementUnit(item) {
            return this.store.movementUnit(item)
        },
        movementSourceLabel(item) {
            const context = this.store.shipmentMovementContext(item)
            if (!context) return this.movementRoute(item)
            return [context.sourceWarehouseName, context.sourceLocation].filter(Boolean).join(' · ') || this.movementRoute(item)
        },
        movementBalanceScope(item) {
            const context = this.store.shipmentMovementContext(item)
            if (!context) return 'Total stock'
            return context.sourceBefore !== null && context.sourceAfter !== null
                ? 'Source stock'
                : context.isBatchShipment
                  ? 'Batch stock total'
                  : 'Total stock'
        },
        movementDisplayBefore(item) {
            const context = this.store.shipmentMovementContext(item)
            const value = context?.sourceBefore !== null && context?.sourceBefore !== undefined
                ? context.sourceBefore
                : this.store.movementBalances(item).totalBefore
            return `${this.formatQuantity(value)} ${this.movementUnit(item)}`
        },
        movementDisplayAfter(item) {
            const context = this.store.shipmentMovementContext(item)
            const value = context?.sourceAfter !== null && context?.sourceAfter !== undefined
                ? context.sourceAfter
                : this.store.movementBalances(item).totalAfter
            return `${this.formatQuantity(value)} ${this.movementUnit(item)}`
        },
        movementBeforeQuantity(item) {
            return this.formatQuantity(this.store.movementBalances(item).totalBefore)
        },
        movementAfterQuantity(item) {
            return this.formatQuantity(this.store.movementBalances(item).totalAfter)
        },
        hasTransferBalances(item) {
            if (!this.isTransferMovement(item)) return false
            const balances = this.store.movementBalances(item)
            return [
                balances.sourceBefore,
                balances.sourceAfter,
                balances.destinationBefore,
                balances.destinationAfter,
            ].every((value) => value !== null)
        },
        transferSourceBalanceLabel(item) {
            const balances = this.store.movementBalances(item)
            return `${this.formatQuantity(balances.sourceBefore)} → ${this.formatQuantity(balances.sourceAfter)} ${this.movementUnit(item)}`
        },
        transferDestinationBalanceLabel(item) {
            const balances = this.store.movementBalances(item)
            return `${this.formatQuantity(balances.destinationBefore)} → ${this.formatQuantity(balances.destinationAfter)} ${this.movementUnit(item)}`
        },
        movementRoute(item) {
            return this.store.movementRoute(item)
        },
        movementDocument(item) {
            return item.receiptId || item.shipmentId || item.transferId || ''
        },
        openFilters() {
            this.filterDraft = {
                search: this.search,
                type: this.type,
                staff: this.staff,
                date: this.date,
            }
            this.filterOpen = true
        },
        clearDraft() {
            this.filterDraft = { search: '', type: '', staff: '', date: '' }
        },
        applyFilters() {
            this.search = this.filterDraft.search
            this.type = this.filterDraft.type
            this.staff = this.filterDraft.staff
            this.date = this.filterDraft.date
            this.filterOpen = false
        },
        formatQuantity(value) {
            return new Intl.NumberFormat('en-MY', {
                maximumFractionDigits: 2,
            }).format(Number(value) || 0)
        },
        formattedDate(value) {
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
        },
        formattedTime(value) {
            return new Intl.DateTimeFormat('en-MY', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
        },
        print() {
            this.selectedMovement = null
            this.filterOpen = false
            this.printGeneratedAt = new Date()
            this.$nextTick(() => {
                window.requestAnimationFrame(() => window.print())
            })
        },
        goBack() {
            if (this.$route.query.from === 'scan') {
                const query = { code: String(this.$route.query.code || this.$route.query.product || '') }
                if (this.$route.query.scanFrom) query.from = String(this.$route.query.scanFrom)
                this.$router.push({ name: 'scan', query })
                return
            }
            this.$router.push({ name: 'dashboard' })
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/history.css"></style>
