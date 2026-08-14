<template>
    <div class="suppliers-page">
        <section class="suppliers-heading">
            <div class="page-title-row">
                <button v-if="$route.query.from === 'dashboard'" class="page-back-link" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <h1 class="inventory-page-title">Suppliers</h1>
            </div>
            <div class="suppliers-heading-actions">
                <button v-if="canReceive" type="button" class="supplier-stock-in-button" @click="openSupplierStockIn">
                    <i class="fa-solid fa-arrow-down"></i>Stock In
                </button>
                <button v-if="canManage" type="button" @click="openCreate">
                    <i class="fa-solid fa-plus"></i>Add Supplier
                </button>
            </div>
        </section>

        <section class="supplier-metrics">
            <article><span class="supplier-metric-icon"><i class="fa-solid fa-truck"></i></span><div><small>Suppliers</small><strong>{{ store.state.suppliers.length }}</strong></div></article>
            <article><span class="supplier-metric-icon"><i class="fa-solid fa-check"></i></span><div><small>Active</small><strong>{{ activeCount }}</strong></div></article>
            <article><span class="supplier-metric-icon"><i class="fa-solid fa-box"></i></span><div><small>Products</small><strong>{{ linkedProducts }}</strong></div></article>
            <article><span class="supplier-metric-icon"><i class="fa-solid fa-layer-group"></i></span><div><small>Batches</small><strong>{{ linkedBatches }}</strong></div></article>
        </section>

        <section class="supplier-panel">
            <header>
                <label>
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input v-model.trim="query" type="search" placeholder="Search supplier, code or contact" />
                </label>
                <ScrollableSelect v-model="statusFilter" aria-label="Supplier status">
                    <option value="">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Unavailable</option>
                </ScrollableSelect>
            </header>

            <div class="supplier-table-head">
                <span>Supplier</span><span>Contact</span><span>Products</span>
                <span>Batches</span><span>Lead Time</span><span>Status</span><span></span>
            </div>
            <div class="supplier-table-body">
                <button
                    v-for="supplier in pagedSuppliers"
                    :key="supplier.id"
                    class="supplier-row"
                    type="button"
                    @click="openDetails(supplier)"
                >
                    <span class="supplier-name">
                        <span><i class="fa-solid fa-truck"></i></span>
                        <span><strong>{{ supplier.name }}</strong><small class="mono">{{ supplier.code }}</small></span>
                    </span>
                    <span class="supplier-contact">
                        <strong>{{ supplier.contactName || 'Not assigned' }}</strong>
                        <small>{{ supplier.phone || supplier.email || '—' }}</small>
                    </span>
                    <strong>{{ supplierProducts(supplier).length }}</strong>
                    <strong>{{ supplierBatches(supplier).length }}</strong>
                    <span>{{ supplier.leadTimeDays }} {{ supplier.leadTimeDays === 1 ? 'day' : 'days' }}</span>
                    <span><small class="supplier-status" :class="supplier.status">{{ supplier.status === 'active' ? 'Active' : 'Unavailable' }}</small></span>
                    <i class="fa-solid fa-chevron-right supplier-row-chevron" aria-hidden="true"></i>
                </button>
                <div v-if="!filteredSuppliers.length" class="supplier-empty">
                    <i class="fa-solid fa-truck-ramp-box"></i><strong>No suppliers found</strong>
                </div>
            </div>
            <footer v-if="filteredSuppliers.length" class="supplier-pagination">
                <button type="button" class="supplier-pagination-nav" aria-label="Previous page" :disabled="suppliersPage <= 1" @click="suppliersPage -= 1"><i class="fa-solid fa-chevron-left"></i></button>
                <button
                    v-for="page in supplierPaginationItems"
                    :key="`supplier-page-${page}`"
                    type="button"
                    class="supplier-pagination-page"
                    :class="{ active: page === suppliersPage, ellipsis: typeof page !== 'number' }"
                    @click="typeof page === 'number' && (suppliersPage = page)"
                >{{ paginationLabel(page) }}</button>
                <button type="button" class="supplier-pagination-nav" aria-label="Next page" :disabled="suppliersPage >= supplierPageCount" @click="suppliersPage += 1"><i class="fa-solid fa-chevron-right"></i></button>
            </footer>
        </section>

        <div v-if="selectedSupplier" class="supplier-modal-backdrop" @mousedown.self="closeDetails">
            <section class="supplier-modal supplier-details-modal" role="dialog" aria-modal="true" aria-label="Supplier details">
                <header>
                    <div>
                        <span>SUPPLIER DETAILS</span>
                        <h2>{{ selectedSupplier.name }}</h2>
                        <p class="mono">{{ selectedSupplier.code }}</p>
                        <p class="supplier-detail-address"><i class="fa-solid fa-location-dot"></i>{{ selectedSupplier.address || 'Address not set' }}</p>
                    </div>
                    <div class="supplier-header-actions">
                        <button v-if="canManage" type="button" aria-label="Edit supplier" @click="editFromDetails">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" aria-label="Close" @click="closeDetails"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </header>

                <div class="supplier-details-body">
                    <section class="supplier-profile-grid">
                        <article>
                            <small>Address</small>
                            <strong class="supplier-profile-truncate" :title="selectedSupplier.address || 'Address not set'">{{ selectedSupplier.address || 'Address not set' }}</strong>
                        </article>
                        <article><small>Lead Time</small><strong>{{ selectedSupplier.leadTimeDays }} days</strong><span>{{ selectedSupplier.paymentTerms || '—' }}</span></article>
                        <article><small>Products</small><strong>{{ selectedSupplierProducts.length }}</strong><span>RM {{ money(supplierValue(selectedSupplier)) }}</span></article>
                        <article><small>Batches</small><strong>{{ selectedSupplierBatches.length }}</strong><span :class="['supplier-detail-status', selectedSupplier.status]">{{ selectedSupplier.status === 'active' ? 'Active' : 'Unavailable' }}</span></article>
                    </section>

                    <section class="supplier-tabbed-content">
                        <nav class="supplier-detail-tabs" aria-label="Supplier details section">
                            <button type="button" :class="{ active: detailTab === 'inventory' }" @click="selectDetailTab('inventory')">
                                <i class="fa-solid fa-boxes-stacked"></i><span>Inventory</span><strong>{{ selectedSupplierProducts.length + selectedSupplierBatches.length }}</strong>
                            </button>
                            <button type="button" :class="{ active: detailTab === 'history' }" @click="selectDetailTab('history')">
                                <i class="fa-solid fa-clock-rotate-left"></i><span>History</span><strong>{{ selectedSupplierHistory.length }}</strong>
                            </button>
                        </nav>

                        <div v-if="detailTab === 'inventory'" class="supplier-inventory-panel supplier-tab-panel">
                            <section class="supplier-inventory-section">
                                <header>
                                    <div><i class="fa-solid fa-box"></i><strong>Products</strong><span>{{ selectedSupplierProducts.length }}</span></div>
                                    <button v-if="canManage && selectedSupplier.status === 'active'" type="button" class="supplier-add-button" title="Add product" aria-label="Add product" @click="openSupplierProduct"><i class="fa-solid fa-plus"></i></button>
                                </header>
                                <div v-if="selectedSupplierProducts.length" class="supplier-product-list">
                                    <button
                                        v-for="product in selectedSupplierProducts"
                                        :key="product.id"
                                        class="supplier-product-card"
                                        type="button"
                                        @click="selectedProduct = product"
                                    >
                                        <span class="supplier-product-photo"><img v-if="product.photo" :src="product.photo" :alt="product.name" /><strong v-else>{{ productInitials(product) }}</strong></span>
                                        <span class="supplier-product-identity"><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }}</small></span>
                                        <span class="supplier-product-stock"><small>On Hand</small><strong>{{ formatQuantity(store.productStock(product.id)) }} {{ product.unit }}</strong></span>
                                        <span class="supplier-product-location"><small>Location</small><strong>{{ productLocation(product) }}</strong></span>
                                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                                    </button>
                                </div>
                                <p v-else class="supplier-detail-empty">No linked products</p>
                            </section>

                            <section class="supplier-inventory-section">
                                <header>
                                    <div><i class="fa-solid fa-layer-group"></i><strong>Batches</strong><span>{{ selectedSupplierBatches.length }}</span></div>
                                    <button v-if="canManage && selectedSupplier.status === 'active'" type="button" class="supplier-add-button" title="Add batch" aria-label="Add batch" @click="openSupplierBatch"><i class="fa-solid fa-plus"></i></button>
                                </header>
                                <div v-if="selectedSupplierBatches.length" class="supplier-batch-list">
                                    <button v-for="batch in selectedSupplierBatches" :key="batch.id" class="supplier-batch-card" type="button" @click="selectedBatch = batch">
                                        <span class="supplier-batch-icon"><i class="fa-solid fa-layer-group"></i></span>
                                        <span><strong>{{ batch.name }}</strong><small class="mono">{{ batch.id }}</small></span>
                                        <span><small>Products</small><strong>{{ batch.productCount }}</strong></span>
                                        <span><small>Available</small><strong>{{ formatQuantity(batch.availableQuantity) }} parts</strong></span>
                                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                                    </button>
                                </div>
                                <p v-else class="supplier-detail-empty">No registered batches</p>
                            </section>
                        </div>

                        <div v-else-if="selectedSupplierHistory.length" class="supplier-delivery-list supplier-tab-panel">
                            <button v-for="movement in selectedSupplierHistory" :key="movement.id" type="button" class="supplier-delivery-row" @click="openHistoryRecord(movement)">
                                <span class="supplier-history-type" :class="movementTone(movement)">
                                    <i class="fa-solid" :class="movementIcon(movement)"></i>
                                    <span><strong>{{ movement.type }}</strong><small>{{ movement.reason || 'Stock adjustment' }}</small></span>
                                </span>
                                <span><strong>{{ movement.productName }}</strong><small class="mono">{{ movement.id }}</small></span>
                                <strong class="supplier-delivery-quantity" :class="movementQuantityClass(movement)">{{ movementQuantityLabel(movement) }}</strong>
                                <span><small>{{ formatDate(movement.createdAt) }}</small><strong>{{ historyReference(movement) }}</strong></span>
                                <i class="fa-solid" :class="receiptForMovement(movement) ? 'fa-file-invoice' : 'fa-chevron-right'"></i>
                            </button>
                        </div>
                        <p v-else class="supplier-detail-empty supplier-tab-panel">No stock history</p>
                    </section>
                </div>
            </section>
        </div>

        <div v-if="editorOpen" class="supplier-modal-backdrop" @mousedown.self="closeEditor">
            <section class="supplier-modal" role="dialog" aria-modal="true" :aria-label="editingId ? 'Edit supplier' : 'Add supplier'">
                <header>
                    <div><span>SUPPLIER RECORD</span><h2>{{ editingId ? 'Edit Supplier' : 'Add Supplier' }}</h2></div>
                    <button type="button" aria-label="Close" @click="closeEditor"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <form @submit.prevent="save">
                    <div class="supplier-form-grid">
                        <label><span>Supplier Name *</span><input v-model.trim="form.name" type="text" /></label>
                        <label><span>Supplier Code</span><input :value="form.code" class="mono" type="text" readonly /></label>
                        <label><span>Contact Person</span><input v-model.trim="form.contactName" type="text" /></label>
                        <label><span>Phone</span><input v-model.trim="form.phone" type="tel" /></label>
                        <label><span>Email</span><input v-model.trim="form.email" type="email" /></label>
                        <label class="full"><span>Address</span><textarea v-model.trim="form.address" rows="3" placeholder="Supplier delivery / billing address"></textarea></label>
                        <label><span>Lead Time (days)</span><input v-model.number="form.leadTimeDays" type="number" min="0" /></label>
                        <label><span>Payment Terms</span><ScrollableSelect v-model="form.paymentTerms"><option>Cash</option><option>7 days</option><option>14 days</option><option>30 days</option><option>60 days</option><option>Internal</option></ScrollableSelect></label>
                        <label><span>Status</span><ScrollableSelect v-model="form.status"><option value="active">Active</option><option value="inactive">Unavailable</option></ScrollableSelect></label>
                    </div>
                    <p v-if="formError" class="supplier-error">{{ formError }}</p>
                    <footer><button type="button" @click="closeEditor">Cancel</button><button class="primary" type="submit"><i class="fa-solid fa-check"></i>Save Supplier</button></footer>
                </form>
            </section>
        </div>

        <ProductDetailsModal
            v-if="selectedProduct"
            :product="selectedProduct"
            @close="selectedProduct = null"
            @receive="openReceive"
            @edit="openProductEditor"
            @view-product="openBatchProduct"
        />
        <BatchDetailsModal
            v-if="selectedBatch"
            :batch="selectedBatch"
            @close="selectedBatch = null"
            @product="openBatchProduct"
            @ship="shipBatch"
        />
        <SupplierReceiptModal v-if="selectedReceipt" :record="selectedReceipt" :supplier="selectedSupplier || receiptSupplier" @close="selectedReceipt = null" />

        <div v-if="selectedMovement" class="supplier-modal-backdrop" @mousedown.self="selectedMovement = null">
            <section class="supplier-modal supplier-history-modal" role="dialog" aria-modal="true" aria-label="Movement details">
                <header>
                    <div>
                        <span>STOCK MOVEMENT</span>
                        <h2>{{ selectedMovement.type || 'Movement details' }}</h2>
                        <p class="mono">{{ selectedMovement.id }}</p>
                    </div>
                    <div class="supplier-header-actions">
                        <button type="button" aria-label="Close" @click="selectedMovement = null"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </header>
                <div class="supplier-history-modal-body">
                    <section class="supplier-history-meta-grid">
                        <article><small>Product</small><strong>{{ selectedMovement.productName || '—' }}</strong><span class="mono">{{ selectedMovement.sku || '—' }}</span></article>
                        <article><small>{{ isTransferMovement(selectedMovement) ? 'Moved' : 'Change' }}</small><strong :class="movementQuantityClass(selectedMovement)">{{ movementQuantityLabel(selectedMovement) }} {{ movementUnit(selectedMovement) }}</strong><span>{{ movementBalanceLabel(selectedMovement) }}</span></article>
                        <article><small>Reference</small><strong class="mono">{{ selectedMovement.reference || '—' }}</strong><span>{{ formatDate(selectedMovement.createdAt) }}</span></article>
                        <article><small>{{ isTransferMovement(selectedMovement) ? 'Route' : 'Location' }}</small><strong>{{ movementRoute(selectedMovement) }}</strong><span class="mono">{{ selectedMovement.batch || 'No batch' }}</span></article>
                    </section>
                    <section class="supplier-history-facts">
                        <div><dt>Reason</dt><dd>{{ selectedMovement.reason || selectedMovement.type || '—' }}</dd></div>
                        <div v-if="selectedMovement.remark"><dt>Remark</dt><dd>{{ selectedMovement.remark }}</dd></div>
                        <div v-if="hasTransferBalances(selectedMovement)"><dt>Source balance</dt><dd>{{ transferSourceBalanceLabel(selectedMovement) }}</dd></div>
                        <div v-if="hasTransferBalances(selectedMovement)"><dt>Destination balance</dt><dd>{{ transferDestinationBalanceLabel(selectedMovement) }}</dd></div>
                        <div v-if="selectedMovement.unitCodes?.length"><dt>Units</dt><dd class="mono">{{ selectedMovement.unitCodes.join(', ') }}</dd></div>
                        <div><dt>Operator</dt><dd>{{ selectedMovement.staffName || 'System' }}</dd></div>
                    </section>
                </div>
                <footer>
                    <button type="button" @click="selectedMovement = null">Close</button>
                </footer>
            </section>
        </div>
        <ProductRegistrationModal v-if="productEditor" :edit-product="productEditor" @close="productEditor = null" @registered="handleProductUpdated" />
        <ProductRegistrationModal v-if="newProductSupplierId" :initial-supplier-id="newProductSupplierId" @close="newProductSupplierId = ''" @registered="handleSupplierProductRegistered" />
    </div>
</template>

<script>
import ProductDetailsModal from '@/components/product/ProductDetailsModal.vue'
import ProductRegistrationModal from '@/components/product/ProductRegistrationModal.vue'
import BatchDetailsModal from '@/components/stock/BatchDetailsModal.vue'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'
import { inventoryStore } from '@/services/inventoryStore'
import { paginationItems, paginationLabel } from '@/utils/pagination'
import { PERMISSIONS } from '@/services/permissions'

export default {
    name: 'SuppliersView',
    components: { ProductDetailsModal, ProductRegistrationModal, BatchDetailsModal, SupplierReceiptModal },
    data() {
        return {
            store: inventoryStore,
            query: '',
            statusFilter: '',
            editorOpen: false,
            selectedSupplierId: '',
            detailTab: 'inventory',
            suppliersPage: 1,
            selectedProduct: null,
            selectedBatch: null,
            selectedReceipt: null,
            receiptSupplier: null,
            selectedMovement: null,
            productEditor: null,
            newProductSupplierId: '',
            editingId: '',
            formError: '',
            form: {},
        }
    },
    computed: {
        canManage() { return this.store.can(PERMISSIONS.MANAGE_SUPPLIERS) },
        canReceive() { return this.store.can(PERMISSIONS.RECEIVE_STOCK) },
        activeCount() { return this.store.state.suppliers.filter((item) => item.status === 'active').length },
        linkedProducts() { return this.store.state.products.filter((product) => product.supplierId).length },
        linkedBatches() { return this.store.batchGroups({ availableOnly: false }).length },
        filteredSuppliers() {
            const query = this.query.toLowerCase()
            return this.store.state.suppliers.filter((supplier) =>
                (!this.statusFilter || supplier.status === this.statusFilter) &&
                (!query || [supplier.name, supplier.code, supplier.contactName, supplier.phone, supplier.email].some((value) => String(value || '').toLowerCase().includes(query))),
            )
        },
        supplierPageCount() {
            return Math.max(1, Math.ceil(this.filteredSuppliers.length / 5))
        },
        supplierPaginationItems() {
            return paginationItems(this.suppliersPage, this.supplierPageCount)
        },
        pagedSuppliers() {
            const start = (this.suppliersPage - 1) * 5
            return this.filteredSuppliers.slice(start, start + 5)
        },
        selectedSupplier() { return this.store.findSupplier(this.selectedSupplierId) },
        selectedSupplierProducts() { return this.selectedSupplier ? this.supplierProducts(this.selectedSupplier) : [] },
        selectedSupplierBatches() { return this.selectedSupplier ? this.supplierBatches(this.selectedSupplier) : [] },
        selectedSupplierHistory() {
            if (!this.selectedSupplier) return []
            const productIds = new Set(this.selectedSupplierProducts.map((product) => product.id))
            return this.store.state.movements
                .filter((movement) => movement.supplierId === this.selectedSupplier.id || (!movement.supplierId && productIds.has(movement.productId)))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        },
    },
    watch: {
        query() { this.suppliersPage = 1 },
        statusFilter() { this.suppliersPage = 1 },
        filteredSuppliers() { if (this.suppliersPage > this.supplierPageCount) this.suppliersPage = this.supplierPageCount },
    },
    methods: {
        paginationLabel,
        money(value) { return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) },
        formatQuantity(value) { return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0) },
        isTransferMovement(movement) { return this.store.isTransferMovement(movement) },
        movementTone(movement) {
            if (this.isTransferMovement(movement)) return 'in'
            return Number(movement?.changedQuantity) > 0 ? 'in' : 'out'
        },
        movementIcon(movement) {
            if (this.isTransferMovement(movement)) return 'fa-right-left'
            return Number(movement?.changedQuantity) > 0 ? 'fa-arrow-down' : 'fa-arrow-up'
        },
        movementQuantityClass(movement) {
            if (this.isTransferMovement(movement)) return ''
            if (Number(movement?.changedQuantity) > 0) return 'positive'
            if (Number(movement?.changedQuantity) < 0) return 'negative'
            return ''
        },
        movementQuantityLabel(movement) {
            const quantity = this.store.movementQuantity(movement)
            if (this.isTransferMovement(movement)) return this.formatQuantity(quantity)
            return `${quantity > 0 ? '+' : ''}${this.formatQuantity(quantity)}`
        },
        movementUnit(movement) { return this.store.movementUnit(movement) },
        movementRoute(movement) { return this.store.movementRoute(movement) },
        movementBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            if (this.isTransferMovement(movement))
                return `Total stock ${this.formatQuantity(balances.totalBefore)} → ${this.formatQuantity(balances.totalAfter)} (unchanged)`
            return `${this.formatQuantity(balances.totalBefore)} → ${this.formatQuantity(balances.totalAfter)}`
        },
        hasTransferBalances(movement) {
            if (!this.isTransferMovement(movement)) return false
            const balances = this.store.movementBalances(movement)
            return [
                balances.sourceBefore,
                balances.sourceAfter,
                balances.destinationBefore,
                balances.destinationAfter,
            ].every((value) => value !== null)
        },
        transferSourceBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            return `${this.formatQuantity(balances.sourceBefore)} → ${this.formatQuantity(balances.sourceAfter)} ${this.movementUnit(movement)}`
        },
        transferDestinationBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            return `${this.formatQuantity(balances.destinationBefore)} → ${this.formatQuantity(balances.destinationAfter)} ${this.movementUnit(movement)}`
        },
        supplierProducts(supplier) {
            return this.store.state.products.filter((product) => product.supplierId === supplier.id || product.supplier === supplier.name)
        },
        supplierBatches(supplier) {
            const linkedProductIds = new Set(this.supplierProducts(supplier).map((product) => product.id))
            return this.store.batchGroups({ availableOnly: false }).filter((batch) =>
                batch.supplierId === supplier.id || (!batch.supplierId && batch.items.some((item) => linkedProductIds.has(item.productId))),
            )
        },
        supplierValue(supplier) {
            return this.supplierProducts(supplier).reduce((sum, product) => sum + this.store.productStock(product.id) * Number(product.costPrice || 0), 0)
        },
        productLocation(product) {
            const rows = this.store.productStockBreakdown(product.id)
            if (!rows.length) return 'Not assigned'
            const warehouses = [...new Set(rows.map((row) => row.warehouseId).filter(Boolean))]
            if (warehouses.length > 1) return `${warehouses.length} warehouses`
            const locations = [...new Set(rows.map((row) => row.location).filter(Boolean))]
            return locations.length > 1 ? `${locations.length} locations` : locations[0] || 'Not assigned'
        },
        productInitials(product) { return String(product.name || 'PR').slice(0, 2).toUpperCase() },
        emptyForm() { return { code: this.store.nextSupplierCode(), name: '', contactName: '', phone: '', email: '', address: '', leadTimeDays: 0, paymentTerms: '30 days', status: 'active' } },
        goBack() {
            this.$router.push({ name: 'dashboard' })
        },
        openSupplierStockIn() { this.$router.push({ name: 'receive', query: { type: 'supplier', supplierFlow: '1', source: 'suppliers', refresh: String(Date.now()) } }) },
        openCreate() { this.editingId = ''; this.formError = ''; this.form = this.emptyForm(); this.editorOpen = true },
        openDetails(supplier) { this.selectedSupplierId = supplier.id; this.detailTab = 'inventory' },
        closeDetails() { this.selectedSupplierId = '' },
        selectDetailTab(tab) { if (this.selectedSupplier && ['inventory', 'history'].includes(tab)) this.detailTab = tab },
        editFromDetails() { if (this.selectedSupplier) { const supplier = this.selectedSupplier; this.closeDetails(); this.openEdit(supplier) } },
        openEdit(supplier) { if (this.canManage) { this.editingId = supplier.id; this.formError = ''; this.form = { ...supplier }; this.editorOpen = true } },
        closeEditor() { this.editorOpen = false; this.editingId = ''; this.formError = '' },
        formatDate(value) {
            if (!value) return '—'
            const candidate = String(value).length === 10 ? `${value}T00:00:00` : value
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(candidate))
        },
        openReceive(product) { this.selectedProduct = null; this.closeDetails(); this.$router.push({ name: 'receive', query: { product: product.id, supplier: product.supplierId || undefined, source: 'suppliers' } }) },
        openProductEditor() { this.productEditor = this.selectedProduct; this.selectedProduct = null },
        openBatchProduct(productId) { this.selectedBatch = null; this.selectedProduct = this.store.findProduct(productId) || this.selectedProduct },
        openSupplierProduct() { if (this.selectedSupplier) this.newProductSupplierId = this.selectedSupplier.id },
        openSupplierBatch() {
            if (!this.selectedSupplier) return
            this.$router.push({ name: 'receive', query: { registerBatch: '1', supplier: this.selectedSupplier.id, source: 'suppliers' } })
        },
        shipBatch(batch) { this.selectedBatch = null; this.closeDetails(); this.$router.push({ name: 'dispatch', query: { mode: 'ship', source: 'batch', batch: batch.id } }) },
        receiptForMovement(movement) {
            if (!movement) return null
            return this.store.state.receipts.find((receipt) =>
                receipt.id === movement.receiptId || receipt.receiptNumber === movement.receiptId ||
                (movement.reference && [receipt.invoiceNumber, receipt.purchaseOrderNumber].includes(movement.reference)),
            ) || null
        },
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
        historyReference(movement) {
            const receipt = this.receiptForMovement(movement)
            return receipt?.invoiceNumber || receipt?.receiptNumber || receipt?.id || movement.reference || '—'
        },
        openHistoryRecord(movement) {
            const receipt = this.receiptForMovement(movement)
            if (receipt) {
                this.selectedReceipt = this.receiptDocument(receipt)
                this.receiptSupplier = this.store.findSupplier(receipt.supplierId) || this.selectedSupplier
                this.selectedMovement = null
                return
            }
            this.selectedMovement = movement
        },
        handleSupplierProductRegistered(product) { this.newProductSupplierId = ''; this.selectedProduct = product },
        handleProductUpdated(product) { this.productEditor = null; this.selectedProduct = product },
        save() {
            try {
                this.store.saveSupplier(this.form, this.editingId)
                this.store.addToast(this.editingId ? 'Supplier updated.' : 'Supplier created.')
                this.closeEditor()
            } catch (error) { this.formError = error.message }
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/suppliers.css"></style>
