<template>
    <main class="sir-page">
        <header class="sir-page__head">
            <div class="page-title-row">
                <button v-if="$route.query.from" class="page-back-link" type="button" @click="goBack"><i class="fa-solid fa-arrow-left"></i><span>Back</span></button>
                <h1 class="inventory-page-title">Supplier Stock In Requests</h1>
            </div>
            <button class="button secondary" type="button" @click="$router.push({ name: 'receive', query: { supplierFlow: '1', from: 'requests' } })"><i class="fa-solid fa-plus"></i>New Request</button>
        </header>

        <section class="sir-shell">
            <header class="sir-toolbar">
                <nav aria-label="Request status">
                    <button type="button" :class="{ active: statusMode === 'pending' }" @click="selectStatus('pending')">Pending <strong>{{ pendingRequests.length }}</strong></button>
                    <button type="button" :class="{ active: statusMode === 'confirmed' }" @click="selectStatus('confirmed')">Confirmed <strong>{{ confirmedRequests.length }}</strong></button>
                    <button type="button" :class="{ active: statusMode === 'cancelled' }" @click="selectStatus('cancelled')">Cancelled <strong>{{ cancelledRequests.length }}</strong></button>
                </nav>
                <label><i class="fa-solid fa-magnifying-glass"></i><input v-model.trim="search" type="search" placeholder="Search request, supplier, product or batch" /></label>
            </header>

            <div class="sir-list-head"><span>REQUEST</span><span>SUPPLIER</span><span>WAREHOUSE</span><span>STOCK</span><span>STATUS</span><span></span></div>
            <div class="sir-list">
                <button v-for="request in pagedRequests" :key="request.id" type="button" @click="openRequest(request)">
                    <span><strong class="mono">{{ request.requestNumber || request.id }}</strong><small>{{ formatDate(request.requestedAt) }}</small></span>
                    <span><strong>{{ request.supplierName }}</strong></span>
                    <span><strong>{{ destinationRouteLabel(request) }}</strong></span>
                    <span><strong>{{ stockLabel(request) }}</strong></span>
                    <span><b class="sir-status" :class="request.status">{{ statusLabel(request.status) }}</b></span>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div v-if="!filteredRequests.length" class="sir-empty"><i class="fa-solid fa-box-open"></i><strong>No {{ statusMode }} supplier requests</strong></div>
            </div>

            <footer v-if="filteredRequests.length" class="sir-pagination">
                <button type="button" :disabled="page <= 1" @click="page -= 1"><i class="fa-solid fa-chevron-left"></i></button>
                <button v-for="item in pageItems" :key="`sir-page-${item}`" type="button" :class="{ active: item === page, ellipsis: typeof item !== 'number' }" @click="typeof item === 'number' && (page = item)">{{ paginationLabel(item) }}</button>
                <button type="button" :disabled="page >= pageCount" @click="page += 1"><i class="fa-solid fa-chevron-right"></i></button>
            </footer>
        </section>

        <div v-if="selectedRequest" class="modal-backdrop sir-confirm-backdrop" @mousedown.self="closeRequest">
            <section class="sir-confirm-modal" role="dialog" aria-modal="true" aria-label="Supplier stock-in request details">
                <header class="modal-header">
                    <div><span class="eyebrow">SUPPLIER STOCK IN {{ selectedRequest.status.toUpperCase() }}</span><h2>{{ selectedRequest.requestNumber || selectedRequest.id }}</h2></div>
                    <div class="sir-modal-header-actions">
                        <button class="icon-button" type="button" aria-label="View request document" title="View request document" @click="requestDocumentOpen = true"><i class="fa-solid fa-print"></i></button>
                        <button class="icon-button" type="button" aria-label="Close" @click="closeRequest"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </header>
                <div class="sir-confirm-body">
                    <section class="sir-confirm-route">
                        <article><small>SUPPLIER</small><strong>{{ selectedRequest.supplierName }}</strong><p>{{ selectedRequest.sourceAddress || 'Address not recorded' }}</p></article>
                        <span><i class="fa-solid fa-arrow-right"></i></span>
                        <article><small>RECEIVE AT</small><strong>{{ destinationRouteLabel(selectedRequest) }}</strong><p>{{ selectedRequest.destinationAddress || 'Address not recorded' }}</p></article>
                    </section>
                    <section class="sir-confirm-stock">
                        <header><span><i class="fa-solid fa-boxes-stacked"></i><strong>{{ requestRows.length }}</strong></span></header>
                        <div>
                            <article v-for="row in requestRows" :key="row.key">
                                <span><strong>{{ row.name }}</strong><small class="mono">{{ row.code }}</small></span>
                                <label v-if="selectedRequest.status === 'pending' && canApprove" class="sir-actual-field"><span>Actual</span><input v-model.number="row.value" type="number" min="0" :step="row.step" /><b>{{ row.unit }}</b></label>
                                <b v-else>{{ formatQuantity(row.value) }} {{ row.unit }}</b>
                            </article>
                        </div>
                    </section>
                    <label v-if="selectedRequest.status === 'pending' && canApprove" class="sir-confirm-remark"><span>Receiving remark</span><textarea v-model.trim="confirmationRemark" rows="2" placeholder="Optional — saved when confirmed or cancelled"></textarea></label>
                    <section v-else-if="selectedRequest.status === 'confirmed' && savedConfirmationRemark(selectedRequest)" class="sir-confirmed-remark">
                        <span>Confirmation remark</span>
                        <p>{{ savedConfirmationRemark(selectedRequest) }}</p>
                    </section>
                    <section v-else-if="selectedRequest.status === 'cancelled' && savedCancellationRemark(selectedRequest)" class="sir-confirmed-remark">
                        <span>Cancellation remark</span>
                        <p>{{ savedCancellationRemark(selectedRequest) }}</p>
                    </section>
                    <p v-if="error" class="sir-confirm-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
                </div>
                <footer class="sir-confirm-actions">
                    <template v-if="selectedRequest.status === 'pending'">
                        <button v-if="canCancel" class="button secondary sir-cancel-button" type="button" @click="cancelRequest"><i class="fa-solid fa-xmark"></i>Cancel</button>
                        <span v-else></span>
                        <span></span>
                        <button v-if="canApprove" class="button primary" type="button" :disabled="!hasActualStock" @click="confirmRequest"><i class="fa-solid fa-check"></i>Confirm Receiving</button>
                    </template>
                    <template v-else-if="selectedRequest.status === 'confirmed'">
                        <span></span>
                        <button class="button secondary sir-document-button" type="button" @click="requestDocumentOpen = true"><i class="fa-solid fa-list-check"></i>Request</button>
                        <button class="button primary" type="button" :disabled="!receiptRecord" @click="receiptOpen = true"><i class="fa-solid fa-file-invoice"></i>Invoice</button>
                    </template>
                </footer>
            </section>
        </div>

        <StockInRequestModal v-if="requestDocumentOpen && selectedRequest" :request="selectedRequest" @close="requestDocumentOpen = false" />

        <SupplierReceiptModal v-if="receiptOpen && receiptRecord" :record="receiptRecord" :supplier="receiptSupplier" @close="receiptOpen = false" />
    </main>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'
import { PERMISSIONS } from '@/services/permissions'
import { paginationItems, paginationLabel } from '@/utils/pagination'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'
import StockInRequestModal from '@/components/stock/StockInRequestModal.vue'

export default {
    name: 'SupplierStockInRequestsView',
    components: { SupplierReceiptModal, StockInRequestModal },
    data() {
        return { store: inventoryStore, statusMode: 'pending', search: '', page: 1, selectedRequestId: '', requestRows: [], confirmationRemark: '', requestDocumentOpen: false, receiptOpen: false, error: '' }
    },
    computed: {
        supplierRequests() { return this.store.state.stockInRequests.filter((request) => request.requestType === 'supplier_stock_in') },
        pendingRequests() { return this.supplierRequests.filter((request) => request.status === 'pending') },
        confirmedRequests() { return this.supplierRequests.filter((request) => request.status === 'confirmed') },
        cancelledRequests() { return this.supplierRequests.filter((request) => request.status === 'cancelled') },
        filteredRequests() {
            const keyword = this.search.toLowerCase()
            const source = this.statusMode === 'confirmed' ? this.confirmedRequests : this.statusMode === 'cancelled' ? this.cancelledRequests : this.pendingRequests
            return source.filter((request) => !keyword || [request.id, request.supplierName, request.destinationWarehouseName, request.destinationLocationName, ...(request.lines || []).flatMap((line) => [line.productName, line.sku, line.batchId])].some((value) => String(value || '').toLowerCase().includes(keyword)))
        },
        pageCount() { return Math.max(1, Math.ceil(this.filteredRequests.length / 5)) },
        pageItems() { return paginationItems(this.page, this.pageCount) },
        pagedRequests() { return this.filteredRequests.slice((this.page - 1) * 5, this.page * 5) },
        selectedRequest() { return this.store.findStockInRequest(this.selectedRequestId) },
        canApprove() {
            return ['Developer', 'Superadmin', 'Inventory Manager'].includes(this.store.currentStaff()?.role)
                && this.store.can(PERMISSIONS.APPROVE_SUPPLIER_RECEIPT)
        },
        canCancel() {
            const employeeId = this.store.state.activeAccount?.employeeId
            return this.canApprove || Boolean(employeeId && employeeId === this.selectedRequest?.requestedBy)
        },
        hasActualStock() { return this.requestRows.some((row) => Number(row.value) > 0) },
        receiptRecord() {
            const receipt = this.selectedRequest?.receipt
            const receipts = receipt?.receipts?.length ? receipt.receipts : [receipt?.receipt].filter(Boolean)
            const first = receipts[0]
            if (!first) return null
            return {
                ...first,
                receiptIds: receipts.map((item) => item.receiptNumber || item.id),
                lines: receipts.flatMap((item) => item.lines || []),
                batchNumber: receipt.batchId || first.batchNumber,
                companyName: 'Inventory Workspace',
                companyDetails: first.warehouseName || this.selectedRequest?.destinationWarehouseName || 'Main Warehouse',
                confirmationRemark: this.savedConfirmationRemark(this.selectedRequest),
            }
        },
        receiptSupplier() { return this.store.findSupplier(this.selectedRequest?.supplierId) },
    },
    watch: { search() { this.page = 1 }, filteredRequests() { if (this.page > this.pageCount) this.page = this.pageCount } },
    created() {
        const request = this.store.findStockInRequest(String(this.$route.query.request || ''))
        if (request?.requestType === 'supplier_stock_in') this.openRequest(request)
    },
    methods: {
        paginationLabel,
        goBack() { this.$router.push({ name: 'dashboard' }) },
        selectStatus(status) { this.statusMode = status; this.page = 1; this.closeRequest() },
        statusLabel(status) { return status === 'confirmed' ? 'Confirmed' : status === 'cancelled' ? 'Cancelled' : 'Pending' },
        openRequest(request) {
            this.selectedRequestId = request.id
            this.error = ''
            this.confirmationRemark = request.status === 'cancelled'
                ? this.savedCancellationRemark(request)
                : this.savedConfirmationRemark(request)
            const payload = request.actualPayload || request.payload || {}
            if (request.target === 'batch') {
                this.requestRows = (payload.batches || []).map((entry) => ({ key: entry.batchId, id: entry.batchId, name: `Batch ${entry.batchId}`, code: `${entry.items?.length || 0} products`, value: Number(entry.batchCount) || 0, unit: 'batches', step: 1 }))
            } else {
                this.requestRows = (payload.items || []).map((item, index) => { const product = this.store.findProduct(item.productId); return { key: `${item.productId}-${index}`, id: item.productId, name: product?.name || 'Product', code: product?.sku || '', value: Number(item.quantity) || 0, unit: product?.unit || '', step: product?.trackingMode === 'unit' ? 1 : 0.01 } })
            }
        },
        closeRequest() { this.selectedRequestId = ''; this.requestRows = []; this.requestDocumentOpen = false; this.receiptOpen = false; this.error = '' },
        confirmRequest() {
            this.error = ''
            try {
                const input = this.selectedRequest.target === 'batch'
                    ? { batchCounts: Object.fromEntries(this.requestRows.map((row) => [row.id, Number(row.value)])), remark: this.confirmationRemark }
                    : { quantities: Object.fromEntries(this.requestRows.map((row) => [row.id, Number(row.value)])), remark: this.confirmationRemark }
                const { request } = this.store.confirmSupplierStockInRequest(this.selectedRequest.id, input)
                this.store.addToast(`${request.requestNumber || request.id} confirmed and stock received.`)
                this.statusMode = 'confirmed'
                this.openRequest(request)
            } catch (error) { this.error = error.message }
        },
        cancelRequest() {
            if (!this.selectedRequest) return
            try {
                const request = this.store.cancelStockInRequest(this.selectedRequest.id, { remark: this.confirmationRemark })
                this.store.addToast(`${request.requestNumber || request.id} cancelled.`)
                this.statusMode = 'cancelled'; this.closeRequest()
            } catch (error) { this.error = error.message }
        },
        savedConfirmationRemark(request) {
            return String(
                request?.confirmationRemark ||
                request?.actualPayload?.confirmationRemark ||
                request?.receipt?.confirmationRemark ||
                request?.receipt?.receipt?.confirmationRemark ||
                '',
            )
        },
        savedCancellationRemark(request) {
            return String(request?.cancellationRemark || request?.cancelRemark || '')
        },
        destinationRouteLabel(request) { return [request?.destinationWarehouseName, request?.destinationLocationName].filter(Boolean).join(' · ') },
        stockLabel(request) { return request.target === 'batch' ? `${request.payload?.batches?.length || 0} batch types` : `${request.payload?.items?.length || 0} products` },
        formatQuantity(value) { return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0) },
        formatDate(value) { return value ? new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—' },
    },
}
</script>

<style scoped src="@/assets/css/pages/stock-movement-requests.css"></style>
<style scoped>
.sir-actual-field { display: grid; grid-template-columns: auto minmax(6rem, 9rem) auto; align-items: center; gap: .6rem; }
.sir-actual-field input { width: 100%; }
.sir-confirm-remark { display: grid; gap: .45rem; }
.sir-confirmed-remark { display: grid; gap: .35rem; padding: .8rem .9rem; border: 1px solid var(--inventory-line); border-radius: .8rem; background: var(--inventory-surface-soft); }
.sir-confirmed-remark > span { font-size: .88rem; font-weight: 800; color: var(--inventory-ink-soft); }
.sir-confirmed-remark > p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--inventory-ink); }
.sir-modal-header-actions { display: flex; align-items: center; gap: .5rem; }
</style>
