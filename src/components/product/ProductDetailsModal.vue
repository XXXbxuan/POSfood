<template>
    <div class="modal-backdrop pd-backdrop" :class="{ 'pd-backdrop--operation': operation }" @click.self="close">
        <section class="form-modal pd-dialog" :class="{ 'pd-dialog--operation': operation }">
            <header class="pd-header">
                <div class="pd-title">
                    <button
                        v-if="operation"
                        class="icon-button"
                        type="button"
                        aria-label="Back"
                        @click="operation = ''"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <span class="eyebrow">{{ operation ? 'STOCK OUT' : 'PRODUCT DETAILS' }}</span>
                        <strong v-if="operation">{{ product.name }}</strong>
                    </div>
                </div>
                <div class="pd-tools">
                    <button
                        v-if="!operation && canPrint"
                        class="icon-button"
                        type="button"
                        aria-label="Print barcode"
                        title="Print barcode"
                        @click="printBarcode"
                    >
                        <i class="fa-solid fa-print"></i>
                    </button>
                    <button
                        v-if="!operation && canEdit"
                        class="icon-button"
                        type="button"
                        aria-label="Delete product"
                        title="Delete product"
                        @click="confirmArchiveProduct"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button
                        v-if="!operation && canEdit"
                        class="icon-button"
                        type="button"
                        aria-label="Edit product"
                        title="Edit product"
                        @click="$emit('edit', product)"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-button" type="button" aria-label="Close" @click="close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <div class="pd-body">
                <aside class="pd-identity">
                    <div class="pd-photo">
                        <img v-if="product.photo" :src="product.photo" :alt="product.name" />
                        <strong v-else>{{ initials }}</strong>
                    </div>
                    <div class="pd-product-name">
                        <h2>{{ product.name }}</h2>
                        <span class="mono">{{ product.sku }}</span>
                        <span class="status-badge" :class="statusClass">{{ inventoryStatus }}</span>
                    </div>
                    <div class="pd-total">
                        <span>Total Stock</span>
                        <strong>{{ formatQuantity(totalStock) }} <small>{{ product.unit }}</small></strong>
                    </div>
                </aside>

                <section class="pd-content" :class="{ 'pd-content--location-open': selectedStockLocation }">
                    <nav v-if="!operation" class="pd-tabs" aria-label="Product details">
                        <button type="button" :class="{ active: activeTab === 'details' }" @click="showTab('details')">
                            <i class="fa-solid fa-box"></i>
                            Details
                        </button>
                        <button type="button" :class="{ active: activeTab === 'inventory' }" @click="showTab('inventory')">
                            <i class="fa-solid fa-boxes-stacked"></i>
                            Stock
                            <span>{{ warehouseCount }}</span>
                        </button>
                        <button type="button" :class="{ active: activeTab === 'movements' }" @click="showTab('movements')">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                            History
                            <span>{{ productMovements.length }}</span>
                        </button>
                    </nav>

                    <section v-if="!operation && activeTab === 'movements'" class="pd-history">
                        <button v-for="movement in productMovements" :key="movement.id" type="button" class="pd-history-row" :class="`is-${movementTone(movement)}`" @click.stop="openMovement(movement)">
                            <span class="pd-history-icon" :class="movementTone(movement)"><i class="fa-solid" :class="movementIcon(movement)"></i></span>
                            <span class="pd-history-reason"><strong>{{ movement.reason || movement.type }}</strong><small>{{ movementLocation(movement) }}</small></span>
                            <span class="pd-history-change" :class="movementTone(movement)"><strong>{{ movementQuantityLabel(movement) }} <em>{{ movementUnit(movement) }}</em></strong></span>
                            <span class="pd-history-date"><strong>{{ formatMovementDate(movement.createdAt) }}</strong><small>{{ formatMovementTime(movement.createdAt) }} · {{ movement.staffName || 'System' }}</small></span>
                            <i class="fa-solid fa-chevron-right pd-history-chevron" aria-hidden="true"></i>
                        </button>
                        <div v-if="!productMovements.length" class="pd-history-empty"><i class="fa-solid fa-clock-rotate-left"></i><strong>No history</strong></div>
                    </section>

                    <template v-if="!operation && activeTab === 'details'">
                        <button
                            class="pd-barcode"
                            type="button"
                            :disabled="!detailBarcode"
                            @click="detailBarcode && (barcodeZoomOpen = true)"
                        >
                            <span>
                                <small>BARCODE</small>
                                <strong class="mono">{{ product.bar || '—' }}</strong>
                            </span>
                            <img v-if="detailBarcode" :src="detailBarcode" :alt="`${product.name} barcode`" />
                            <i v-else class="fa-solid fa-barcode"></i>
                        </button>

                        <dl class="pd-facts">
                            <div><dt>Category</dt><dd>{{ product.category || '—' }}</dd></div>
                            <div><dt>Type</dt><dd>{{ product.type || '—' }}</dd></div>
                            <div><dt>Supplier</dt><dd>{{ product.supplier || '—' }}</dd></div>
                            <div><dt>Minimum</dt><dd>{{ formatQuantity(product.minimumStock) }} {{ product.unit }}</dd></div>
                            <div><dt>Tracking</dt><dd>{{ trackingLabel }}</dd></div>
                            <div><dt>Warehouses</dt><dd>{{ warehouseCount }}</dd></div>
                            <div><dt>Receipt Layers</dt><dd>{{ standaloneLots.length }}</dd></div>
                            <div><dt>Available Units</dt><dd>{{ availableUnits.length }}</dd></div>
                        </dl>

                        <div v-if="canReceive || canIssue" class="pd-actions">
                            <button v-if="canReceive" class="button stock-in" type="button" @click="$emit('receive', product)">
                                <i class="fa-solid fa-arrow-down"></i>
                                Stock In
                            </button>
                            <button v-if="canIssue" class="button stock-out" type="button" @click="operation = 'out'">
                                <i class="fa-solid fa-arrow-up"></i>
                                Stock Out
                            </button>
                            <button v-if="canIssue" class="button pd-movement-action" type="button" @click="moveProduct">
                                <i class="fa-solid fa-right-left"></i>
                                Stock Movement
                            </button>
                            <button v-if="canIssue" class="button pd-ship-action" type="button" aria-label="Ship product" title="Ship product" @click="shipProduct">
                                <i class="fa-solid fa-truck-arrow-right"></i>
                            </button>
                        </div>
                    </template>

                    <section v-else-if="!operation && activeTab === 'inventory'" class="pd-inventory">
                        <section class="pd-stock-overview">
                            <header class="pd-stock-heading">
                                <strong>Stock Breakdown</strong>
                                <b>{{ formatQuantity(totalStock) }} <small>{{ product.unit }}</small></b>
                            </header>

                            <div class="pd-warehouse-grid">
                                <button
                                    v-for="warehouse in warehouseCards"
                                    :key="warehouse.id"
                                    class="pd-warehouse-card"
                                    :class="{ active: selectedWarehouseCard?.id === warehouse.id }"
                                    type="button"
                                    @click.stop="selectWarehouse(warehouse.id)"
                                >
                                    <span class="pd-warehouse-card-icon"><i class="fa-solid fa-boxes-stacked"></i></span>
                                    <span class="pd-warehouse-card-copy">
                                        <strong>{{ warehouse.name }}</strong>
                                        <small>{{ warehouse.code }}</small>
                                    </span>
                                    <span v-if="warehouse.hasStock" class="pd-warehouse-card-stock">
                                        <b>{{ formatQuantity(warehouse.quantity) }}</b>
                                        <small>{{ product.unit }}</small>
                                    </span>
                                    <span v-else class="pd-warehouse-card-stock empty">
                                        <b>—</b>
                                        <small>No stock</small>
                                    </span>
                                    <span v-if="warehouse.hasStock" class="pd-warehouse-card-meta">
                                        {{ warehouse.locationCount }} {{ warehouse.locationCount === 1 ? 'Location' : 'Locations' }}
                                        · {{ warehouse.batchCount }} {{ warehouse.batchCount === 1 ? 'Batch' : 'Batches' }}
                                    </span>
                                    <span v-else class="pd-warehouse-card-meta">No stock stored</span>
                                </button>
                            </div>
                        </section>

                        <section v-if="selectedWarehouseCard" class="pd-warehouse-detail" :class="{ 'pd-warehouse-detail--location-open': selectedStockLocation }">
                            <header class="pd-selected-warehouse">
                                <div>
                                    <small>SELECTED WAREHOUSE</small>
                                    <strong>{{ selectedWarehouseCard.name }}</strong>
                                </div>
                                <b v-if="selectedWarehouseCard.hasStock">
                                    {{ formatQuantity(selectedWarehouseCard.quantity) }}
                                    <small>{{ product.unit }}</small>
                                </b>
                                <b v-else class="empty">—</b>
                            </header>

                            <div v-if="selectedWarehouseCard.hasStock" class="pd-stock-detail-body">
                                <section class="pd-location-section">
                                    <header>
                                        <strong>Locations</strong>
                                        <span>{{ selectedLocationRows.length }}</span>
                                    </header>
                                    <div class="pd-location-list">
                                        <button
                                            v-for="location in selectedLocationRows"
                                            :key="location.id"
                                            class="pd-location-row"
                                            type="button"
                                            @click.stop="openStockLocation(location)"
                                        >
                                            <span class="pd-location-icon"><i class="fa-solid fa-location-dot"></i></span>
                                            <span>
                                                <strong>{{ location.name }}</strong>
                                                <small>{{ location.batchCount }} {{ location.batchCount === 1 ? 'batch' : 'batches' }}</small>
                                            </span>
                                            <b>{{ formatQuantity(location.quantity) }} <small>{{ product.unit }}</small></b>
                                            <i class="fa-solid fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </section>
                            </div>

                            <div
                                v-if="selectedStockLocation"
                                class="pd-location-popover"
                                role="dialog"
                                aria-modal="true"
                                aria-label="Location stock details"
                            >
                                <header class="pd-location-popover-head">
                                    <button class="icon-button" type="button" aria-label="Back to locations" @click="closeStockLocation">
                                        <i class="fa-solid fa-arrow-left"></i>
                                    </button>
                                    <div>
                                        <small>LOCATION STOCK</small>
                                        <strong>{{ selectedStockLocation.name }}</strong>
                                    </div>
                                    <span>{{ formatQuantity(selectedStockLocation.quantity) }} {{ product.unit }}</span>
                                    <button class="icon-button" type="button" aria-label="Close product details" @click="close">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </header>

                                <div class="pd-location-popover-body">
                                    <section class="pd-batch-section pd-batch-section-focused pd-location-products">
                                        <header><strong>Products</strong><span>{{ locationProductRows.length }}</span></header>
                                        <div class="pd-batch-list">
                                            <article v-for="row in locationProductRows" :key="row.id" class="pd-batch-item pd-location-product-item">
                                                <button class="pd-batch-row" type="button" @click="selectedLocationProduct = row">
                                                    <span class="pd-product-lot-symbol"><i class="fa-solid fa-box"></i></span>
                                                    <span class="pd-batch-name"><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }}</small></span>
                                                    <span class="pd-batch-stock"><small>Available</small><strong>{{ formatQuantity(row.availableQuantity) }} {{ product.unit }}</strong></span>
                                                    <i class="fa-solid fa-chevron-right"></i>
                                                </button>
                                            </article>
                                            <div v-if="!locationProductRows.length" class="pd-mini-empty">No standalone products in this location.</div>
                                        </div>
                                    </section>

                                    <section class="pd-batch-section pd-batch-section-focused">
                                        <header>
                                            <strong>Batches</strong>
                                            <span>{{ locationBatchRows.length }}</span>
                                        </header>
                                        <div class="pd-batch-list">
                                            <article v-for="(batch, index) in locationBatchRows" :key="batch.id" class="pd-batch-item">
                                                <button class="pd-batch-row" type="button" @click="openBatchDetails(batch)">
                                                    <span class="pd-batch-name">
                                                        <small>Batch {{ index + 1 }}</small>
                                                        <strong class="mono">{{ batch.batchGroupId || batch.batchNumber }}</strong>
                                                        <em class="pd-group-batch-badge"><i class="fa-solid fa-layer-group"></i>{{ batch.isRegisteredBatch ? 'Grouped batch' : 'Tracked batch' }}</em>
                                                    </span>
                                                    <span class="pd-batch-stock">
                                                        <small>Available</small>
                                                        <strong>{{ formatQuantity(batch.availableQuantity) }} {{ product.unit }}</strong>
                                                    </span>
                                                    <i class="fa-solid fa-chevron-right"></i>
                                                </button>
                                            </article>
                                            <div v-if="!locationBatchRows.length" class="pd-mini-empty">No stock batches in this location.</div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <div v-if="!selectedWarehouseCard.hasStock" class="pd-no-warehouse-stock">
                                <i class="fa-solid fa-box-open"></i>
                                <strong>No stock stored</strong>
                            </div>
                        </section>
                    </section>

                    <StockOperationForm
                        v-if="operation"
                        :product="product"
                        direction="out"
                        :show-close="false"
                        @completed="completeOperation"
                    />
                </section>
            </div>

            <div v-if="barcodeZoomOpen" class="pd-zoom-backdrop" @click.self="barcodeZoomOpen = false">
                <section class="pd-zoom" role="dialog" aria-modal="true" aria-label="Barcode">
                    <header>
                        <div>
                            <span class="eyebrow">BARCODE</span>
                            <strong>{{ product.name }}</strong>
                        </div>
                        <button class="icon-button" type="button" aria-label="Close" @click="barcodeZoomOpen = false">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>
                    <img :src="detailBarcode" :alt="`${product.name} enlarged barcode`" />
                    <strong class="mono">{{ product.bar }}</strong>
                </section>
            </div>

            <BatchDetailsModal
                v-if="selectedBatchDetails?.items"
                :batch="selectedBatchDetails"
                @close="closeBatchDetails"
                @product="viewBatchProduct"
                @ship="shipBatch"
            />

            <StockItemDetailsModal
                v-if="selectedLocationProduct"
                :product="product"
                :stock="selectedLocationProduct"
                @close="selectedLocationProduct = null"
                @receive="receiveStockProduct"
                @ship="shipStockProduct"
            />

            <div v-if="selectedUnit" class="pd-unit-modal-backdrop" @click.self="closeUnit">
                <section class="pd-unit-modal" role="dialog" aria-modal="true" aria-label="Unit barcode details">
                    <header>
                        <div>
                            <span class="eyebrow">UNIT DETAILS</span>
                            <strong>{{ product.name }}</strong>
                        </div>
                        <button class="icon-button" type="button" aria-label="Close unit details" @click="closeUnit">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>

                    <div class="pd-unit-modal-body">
                        <div class="pd-unit-summary">
                            <span class="pd-unit-modal-icon"><i class="fa-solid fa-barcode"></i></span>
                            <span>
                                <small>UNIT</small>
                                <strong>{{ selectedUnit.ordinal || '—' }}/{{ selectedUnit.receiptQuantity || '—' }}</strong>
                            </span>
                            <span class="pd-unit-status" :class="`status-${String(selectedUnit.status || 'available').toLowerCase()}`">
                                {{ unitStatusLabel(selectedUnit.status) }}
                            </span>
                        </div>

                        <dl class="pd-unit-details-grid">
                            <div><dt>Unit Code</dt><dd class="mono">{{ selectedUnit.code }}</dd></div>
                            <div><dt>Batch</dt><dd class="mono">{{ selectedUnitBatch?.batchNumber || selectedUnit.batchId || '—' }}</dd></div>
                            <div><dt>Warehouse</dt><dd>{{ selectedUnit.warehouseName || selectedWarehouseCard?.name || '—' }}</dd></div>
                            <div><dt>Location</dt><dd>{{ selectedUnit.location || '—' }}</dd></div>
                        </dl>

                        <div class="pd-unit-barcode">
                            <img v-if="selectedUnitBarcode" :src="selectedUnitBarcode" :alt="`${selectedUnit.code} barcode`" />
                            <i v-else class="fa-solid fa-barcode"></i>
                            <strong class="mono">{{ selectedUnit.code }}</strong>
                        </div>
                    </div>

                    <footer>
                        <button class="button secondary" type="button" @click="closeUnit">Close</button>
                        <button class="button primary" type="button" :disabled="!selectedUnitBarcode || !canPrint" @click="printUnitLabel">
                            <i class="fa-solid fa-print"></i>
                            Print Label
                        </button>
                    </footer>
                </section>
            </div>


            <SupplierReceiptModal
                v-if="selectedReceipt"
                :record="selectedReceipt"
                :supplier="receiptSupplier"
                @close="selectedReceipt = null"
            />

            <div v-if="selectedMovement" class="pd-batch-modal-backdrop" @click.self="selectedMovement = null">
                <section class="pd-batch-modal pd-movement-record-modal" role="dialog" aria-modal="true" aria-label="Movement details">
                    <header class="pd-movement-record-header">
                        <div>
                            <span class="eyebrow">STOCK MOVEMENT</span>
                            <h2>{{ selectedMovement.type || 'Movement details' }}</h2>
                            <p class="mono">{{ selectedMovement.document || selectedMovement.id }}</p>
                        </div>
                        <div class="pd-movement-record-actions">
                            <button
                                v-if="selectedMovementInvoice"
                                class="icon-button"
                                type="button"
                                aria-label="View linked invoice"
                                title="View invoice"
                                @click="openSelectedMovementInvoice"
                            ><i class="fa-solid fa-file-invoice"></i></button>
                            <button class="icon-button" type="button" aria-label="Close movement details" @click="selectedMovement = null">
                            <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </header>

                    <div class="pd-movement-record-body">
                        <section class="pd-movement-record-grid">
                            <article>
                                <small>Product</small>
                                <strong>{{ selectedMovement.productName || product.name }}</strong>
                                <span class="mono">{{ selectedMovement.sku || product.sku }}</span>
                            </article>
                            <article>
                                <small>{{ isTransferMovement(selectedMovement) ? 'Moved' : 'Change' }}</small>
                                <strong :class="movementTone(selectedMovement)">{{ movementQuantityLabel(selectedMovement) }} {{ movementUnit(selectedMovement) }}</strong>
                                <span>{{ movementBalanceLabel(selectedMovement) }}</span>
                            </article>
                            <article>
                                <small>Reference</small>
                                <strong class="mono">{{ selectedMovement.reference || '—' }}</strong>
                                <span>{{ formatMovementDate(selectedMovement.createdAt) }}</span>
                            </article>
                            <article>
                                <small>{{ isTransferMovement(selectedMovement) ? 'Route' : 'Location' }}</small>
                                <strong>{{ movementLocation(selectedMovement) }}</strong>
                                <span class="mono">{{ selectedMovement.batch || 'No batch' }}</span>
                            </article>
                        </section>

                        <dl class="pd-movement-record-facts">
                            <div><dt>Reason</dt><dd>{{ selectedMovement.reason || selectedMovement.type || '—' }}</dd></div>
                            <div><dt>Remark</dt><dd>{{ selectedMovement.remark || '—' }}</dd></div>
                            <div v-if="hasTransferBalances(selectedMovement)"><dt>Source balance</dt><dd>{{ transferSourceBalanceLabel(selectedMovement) }}</dd></div>
                            <div v-if="hasTransferBalances(selectedMovement)"><dt>Destination balance</dt><dd>{{ transferDestinationBalanceLabel(selectedMovement) }}</dd></div>
                            <div><dt>Units</dt><dd class="mono">{{ selectedMovement.unitCodes?.length ? selectedMovement.unitCodes.join(', ') : '—' }}</dd></div>
                            <div><dt>Operator</dt><dd>{{ selectedMovement.staffName || 'System' }}</dd></div>
                        </dl>

                        <img v-if="selectedMovement.photo" class="pd-movement-photo" :src="selectedMovement.photo" alt="Stock movement evidence" />
                    </div>
                </section>
            </div>
        </section>
    </div>
</template>

<script>
import BatchDetailsModal from '@/components/stock/BatchDetailsModal.vue'
import StockItemDetailsModal from '@/components/stock/StockItemDetailsModal.vue'
import StockOperationForm from '@/components/stock/StockOperationForm.vue'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'
import { inventoryStore } from '@/services/inventoryStore'
import { PERMISSIONS } from '@/services/permissions'
import { barcodeDataUrl } from '@/utils/barcode'

export default {
    name: 'ProductDetailsModal',
    components: { BatchDetailsModal, StockItemDetailsModal, StockOperationForm, SupplierReceiptModal },
    props: {
        product: { type: Object, required: true },
    },
    emits: ['close', 'edit', 'receive', 'updated', 'view-product'],
    data() {
        return {
            store: inventoryStore,
            detailBarcode: '',
            barcodeZoomOpen: false,
            operation: '',
            activeTab: 'details',
            selectedWarehouseId: '',
            selectedStockLocationId: '',
            stockLocationScrollTop: 0,
            selectedLocationProduct: null,
            expandedBatchIds: {},
            selectedBatchDetails: null,
            selectedUnit: null,
            selectedUnitBatch: null,
            selectedUnitBarcode: '',
            selectedMovement: null,
            selectedReceipt: null,
            receiptSupplier: null,
        }
    },
    computed: {
        initials() {
            return String(this.product.name || '').slice(0, 2).toUpperCase()
        },
        totalStock() {
            return this.store.productStock(this.product.id)
        },
        inventoryStatus() {
            if (!this.product.active) return 'Inactive'
            if (this.totalStock <= 0) return 'Out of Stock'
            if (this.totalStock <= Number(this.product.minimumStock || 0)) return 'Low Stock'
            return 'In Stock'
        },
        statusClass() {
            return `status-${this.inventoryStatus.toLowerCase().replaceAll(' ', '-')}`
        },
        selectedMovementInvoice() {
            return this.receiptForMovement(this.selectedMovement, { invoiceOnly: true })
        },
        breakdown() {
            return this.store.productStockBreakdown(this.product.id)
        },
        warehouseCount() {
            return new Set(this.breakdown.map((row) => row.warehouseId)).size
        },
        warehouseCards() {
            return this.store.state.warehouses.map((warehouse) => {
                const positions = this.positions.filter(
                    (position) =>
                        position.warehouseId === warehouse.id &&
                        Number(position.availableQuantity) > 0,
                )
                const quantity = positions.reduce(
                    (sum, position) => sum + Number(position.availableQuantity || 0),
                    0,
                )
                return {
                    ...warehouse,
                    quantity,
                    hasStock: quantity > 0,
                    locationCount: new Set(positions.map((position) => position.locationId)).size,
                    batchCount: new Set(
                        positions
                            .filter((position) => this.lotIsVisibleBatch(this.lots.find((lot) => lot.id === position.lotId)))
                            .map((position) => position.lotId),
                    ).size,
                }
            })
        },
        selectedWarehouseCard() {
            return (
                this.warehouseCards.find((warehouse) => warehouse.id === this.selectedWarehouseId) ||
                this.warehouseCards.find((warehouse) => warehouse.hasStock) ||
                this.warehouseCards[0] ||
                null
            )
        },
        selectedWarehousePositions() {
            if (!this.selectedWarehouseCard) return []
            return this.positionRows.filter(
                (position) => position.warehouseId === this.selectedWarehouseCard.id,
            )
        },
        selectedLocationRows() {
            const rows = new Map()
            this.selectedWarehousePositions.forEach((position) => {
                const current = rows.get(position.locationId) || {
                    id: position.locationId,
                    name: position.location || 'Not assigned',
                    quantity: 0,
                    lotIds: new Set(),
                }
                current.quantity += Number(position.availableQuantity || 0)
                const lot = this.lots.find((candidate) => candidate.id === position.lotId)
                if (this.lotIsVisibleBatch(lot)) current.lotIds.add(position.lotId)
                rows.set(position.locationId, current)
            })
            return [...rows.values()]
                .map((row) => ({ ...row, batchCount: row.lotIds.size }))
                .sort((a, b) => a.name.localeCompare(b.name))
        },
        selectedStockLocation() {
            return this.selectedLocationRows.find(
                (location) => location.id === this.selectedStockLocationId,
            ) || null
        },
        locationBatchRows() {
            if (!this.selectedStockLocationId) return []
            return this.selectedBatchRows.filter(
                (batch) =>
                    batch.locationId === this.selectedStockLocationId &&
                    batch.isBatch,
            )
        },
        locationProductRows() {
            if (!this.selectedStockLocationId) return []
            const receipts = this.selectedBatchRows.filter(
                (row) => row.locationId === this.selectedStockLocationId && !row.isBatch,
            )
            if (!receipts.length) return []
            return [{
                id: `${this.product.id}-${this.selectedStockLocationId}-standalone`,
                productId: this.product.id,
                warehouseId: receipts[0].warehouseId,
                warehouseName: receipts[0].warehouseName,
                locationId: this.selectedStockLocationId,
                locationName: receipts[0].locationName,
                location: receipts[0].locationName,
                availableQuantity: receipts.reduce((sum, row) => sum + Number(row.availableQuantity || 0), 0),
                receivedAt: receipts.map((row) => row.receivedAt).filter(Boolean).sort()[0] || '',
                units: receipts.flatMap((row) => row.units || []),
                receipts: receipts.map((row) => ({
                    id: row.lotId,
                    lotId: row.lotId,
                    layerCode: row.batchNumber,
                    availableQuantity: Number(row.availableQuantity || 0),
                    receivedQuantity: Number(row.receivedQuantity || 0),
                    receivedDate: row.receivedDate,
                    receivedAt: row.receivedAt,
                    expiryDate: row.expiryDate,
                    units: row.units || [],
                })),
            }]
        },
        selectedBatchRows() {
            const lotMap = new Map(this.lots.map((lot) => [lot.id, lot]))
            return this.selectedWarehousePositions
                .map((position) => {
                    const lot = lotMap.get(position.lotId) || {}
                    const units = this.store.state.stockUnits
                        .filter(
                            (unit) =>
                                unit.productId === this.product.id &&
                                unit.lotId === position.lotId &&
                                unit.positionId === position.id,
                        )
                        .slice()
                        .sort((a, b) => Number(a.ordinal || 0) - Number(b.ordinal || 0))
                    const isRegisteredBatch = Boolean(lot.isBatch && lot.batchGroupId)
                    const receipt = this.store.state.receipts.find((item) => item.id === lot.receiptId)
                    return {
                        ...position,
                        batchNumber: lot.batchNumber || position.batchNumber || '—',
                        receivedDate: lot.receivedDate || '',
                        receivedAt: receipt?.createdAt || receipt?.receivedDate || lot.createdAt || lot.receivedDate || '',
                        expiryDate: lot.expiryDate || '',
                        receivedQuantity: Number(lot.receivedQuantity || position.availableQuantity || 0),
                        locationName: position.location || 'Not assigned',
                        isBatch: isRegisteredBatch,
                        isRegisteredBatch,
                        batchGroupId: lot.batchGroupId || '',
                        units,
                    }
                })
                .sort((a, b) =>
                    `${a.locationName}-${a.batchNumber}`.localeCompare(`${b.locationName}-${b.batchNumber}`),
                )
        },
        positions() {
            return this.store.stockPositionsFor(this.product.id)
        },
        lots() {
            return this.store.stockLotsFor(this.product.id)
        },
        standaloneLots() {
            return this.store.stockLotsFor(this.product.id, { stockSource: 'standalone' })
        },
        positionRows() {
            const lotMap = new Map(this.lots.map((lot) => [lot.id, lot]))
            return this.positions
                .filter((position) => Number(position.availableQuantity) > 0)
                .map((position) => ({
                    ...position,
                    warehouseName:
                        this.store.findWarehouse(position.warehouseId)?.name ||
                        position.warehouseName ||
                        'Warehouse',
                    batchNumber: lotMap.get(position.lotId)?.batchNumber || '—',
                }))
                .sort((a, b) =>
                    `${a.warehouseName}-${a.location}-${a.batchNumber}`.localeCompare(
                        `${b.warehouseName}-${b.location}-${b.batchNumber}`,
                    ),
                )
        },
        availableUnits() {
            return this.store.availableStockUnits(this.product.id)
        },
        productMovements() {
            return this.store.state.movements.filter((movement) => movement.productId === this.product.id)
        },
        trackingLabel() {
            return {
                none: 'Quantity',
                batch: 'Expiry / Lot',
                unit: 'Unit Barcode',
            }[this.product.trackingMode] || 'Quantity'
        },
        canEdit() {
            return this.store.can(PERMISSIONS.MANAGE_PRODUCTS)
        },
        canReceive() {
            return this.store.can(PERMISSIONS.RECEIVE_STOCK)
        },
        canIssue() {
            return this.store.can(PERMISSIONS.ISSUE_STOCK) && this.totalStock > 0
        },
        canPrint() {
            return this.store.can(PERMISSIONS.PRINT_LABELS)
        },
        canViewHistory() {
            return this.store.can(PERMISSIONS.VIEW_STOCK_HISTORY)
        },
    },
    watch: {
        'product.bar': {
            immediate: true,
            handler() {
                this.createBarcode()
            },
        },
        'product.id'() {
            this.activeTab = 'details'
            this.operation = ''
            this.createBarcode()
            this.resetStockView()
        },
    },
    methods: {
        lotIsVisibleBatch(lot) {
            return Boolean(lot?.isBatch && lot?.batchGroupId)
        },
        close() {
            this.closeBatchDetails()
            this.closeUnit()
            this.selectedMovement = null
            this.selectedReceipt = null
            this.receiptSupplier = null
            this.$emit('close')
        },
        formatQuantity(value) {
            return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0)
        },
        createBarcode() {
            const code = String(this.product?.bar || this.product?.sku || '').trim()
            if (!code) {
                this.detailBarcode = ''
                return
            }
            try {
                this.detailBarcode = barcodeDataUrl(code, {
                    margin: 0,
                    width: 2.4,
                    height: 84,
                    fontSize: 16,
                    displayValue: false,
                })
            } catch {
                this.detailBarcode = ''
            }
        },
        printBarcode() {
            if (!this.detailBarcode) {
                this.store.addToast('Barcode unavailable for this product.', 'danger')
                return
            }
            const printWindow = window.open('', '_blank', 'width=640,height=480')
            if (!printWindow) {
                this.store.addToast('Allow pop-ups to print this barcode.', 'danger')
                return
            }
            const name = String(this.product.name || 'Product').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            const code = String(this.product.bar || this.product.sku || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            printWindow.document.write(`<!doctype html><html><head><title>${name}</title><style>@page{margin:12mm}body{display:grid;min-height:90vh;place-items:center;font-family:Arial,sans-serif;color:#17353a}.label{width:100mm;padding:8mm;border:.5mm solid #17353a;text-align:center}.label strong{display:block;font-size:16pt}.label img{width:100%;height:34mm;object-fit:contain;margin:5mm 0}.label small{font:700 11pt monospace}</style></head><body><section class="label"><strong>${name}</strong><img src="${this.detailBarcode}" alt=""><small>${code}</small></section><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
            printWindow.document.close()
        },
        shipProduct() {
            this.$router.push({
                name: 'dispatch',
                query: { mode: 'ship', product: this.product.id },
            })
        },
        moveProduct() {
            this.$router.push({
                name: 'dispatch',
                query: { mode: 'move', product: this.product.id },
            })
        },
        confirmArchiveProduct() {
            const confirmed = window.confirm(
                `Remove ${this.product.name} from active inventory? Historical stock records will be kept.`,
            )
            if (!confirmed) return
            try {
                this.store.setProductActive(this.product.id, false)
                this.store.addToast(`${this.product.name} was removed from active inventory.`)
                this.$emit('updated')
                this.close()
            } catch (error) {
                this.store.addToast(error.message, 'danger')
            }
        },
        resetStockView() {
            this.selectedWarehouseId = ''
            this.selectedStockLocationId = ''
            this.selectedLocationProduct = null
            this.expandedBatchIds = {}
            this.closeBatchDetails()
            this.closeUnit()
            this.selectedMovement = null
            this.selectedReceipt = null
            this.receiptSupplier = null
        },
        showTab(tab) {
            this.closeStockLocation()
            this.selectedMovement = null
            this.selectedReceipt = null
            this.receiptSupplier = null
            this.activeTab = tab
        },
        receiptForMovement(movement, options = {}) {
            return this.store.findReceiptForMovement(movement, options)
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
        openMovement(movement) {
            this.selectedReceipt = null
            this.receiptSupplier = null
            this.selectedMovement = movement
        },
        openSelectedMovementInvoice() {
            const receipt = this.selectedMovementInvoice
            if (!receipt) return
            this.selectedReceipt = this.receiptDocument(receipt)
            this.receiptSupplier = this.store.findSupplier(receipt.supplierId) || null
        },
        movementTone(movement) {
            if (this.isTransferMovement(movement)) return 'transfer'
            if (['Damage', 'Expired', 'Lost'].includes(movement?.type)) return 'warning'
            return Number(movement?.changedQuantity) > 0 ? 'in' : 'out'
        },
        movementIcon(movement) {
            if (this.isTransferMovement(movement)) return 'fa-right-left'
            if (movement?.type === 'Label Print') return 'fa-print'
            if (movement?.type === 'Shipment') return 'fa-truck-arrow-right'
            if (movement?.type === 'Shipment Void') return 'fa-rotate-left'
            if (movement?.type === 'Damage') return 'fa-triangle-exclamation'
            if (movement?.type === 'Expired') return 'fa-calendar-xmark'
            if (movement?.type === 'Lost') return 'fa-circle-question'
            return Number(movement?.changedQuantity) > 0 ? 'fa-arrow-down' : 'fa-arrow-up'
        },
        isTransferMovement(movement) {
            return this.store.isTransferMovement(movement)
        },
        movementLocation(movement) {
            return this.store.movementRoute(movement)
        },
        movementQuantityLabel(movement) {
            const quantity = this.store.movementQuantity(movement)
            if (this.isTransferMovement(movement)) return this.formatQuantity(quantity)
            return this.signedQuantity(quantity)
        },
        movementUnit(movement) {
            return this.store.movementUnit(movement) || this.product.unit
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
        movementBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            if (this.isTransferMovement(movement))
                return `Total stock ${this.formatQuantity(balances.totalBefore)} → ${this.formatQuantity(balances.totalAfter)} (unchanged)`
            return `Total stock ${this.formatQuantity(balances.totalBefore)} → ${this.formatQuantity(balances.totalAfter)}`
        },
        signedQuantity(value) {
            const quantity = Number(value) || 0
            return `${quantity > 0 ? '+' : ''}${this.formatQuantity(quantity)}`
        },
        formatMovementDate(value) {
            if (!value) return '—'
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
        },
        formatMovementTime(value) {
            if (!value) return '—'
            return new Intl.DateTimeFormat('en-MY', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
        },
        selectWarehouse(warehouseId) {
            this.selectedWarehouseId = warehouseId
            this.selectedStockLocationId = ''
            this.expandedBatchIds = {}
            this.closeBatchDetails()
            this.closeUnit()
        },
        openStockLocation(location) {
            const content = this.$el?.querySelector('.pd-content')
            this.stockLocationScrollTop = Number(content?.scrollTop || 0)
            this.selectedStockLocationId = location.id
            this.expandedBatchIds = {}
            this.selectedLocationProduct = null
            this.$nextTick(() => {
                const currentContent = this.$el?.querySelector('.pd-content')
                if (currentContent) currentContent.scrollTop = 0
            })
        },
        closeStockLocation() {
            const restoreScrollTop = this.stockLocationScrollTop
            this.selectedStockLocationId = ''
            this.selectedLocationProduct = null
            this.expandedBatchIds = {}
            this.closeBatchDetails()
            this.closeUnit()
            this.$nextTick(() => {
                const content = this.$el?.querySelector('.pd-content')
                if (content) content.scrollTop = restoreScrollTop
            })
        },
        receiveStockProduct(stock) {
            this.close()
            this.$router.push({
                name: 'receive',
                query: {
                    type: 'standard',
                    product: this.product.id,
                    warehouse: stock.warehouseId,
                    location: stock.locationId,
                    from: 'products',
                },
            })
        },
        shipStockProduct(stock) {
            this.close()
            this.$router.push({
                name: 'dispatch',
                query: {
                    mode: 'ship',
                    product: this.product.id,
                    warehouse: stock.warehouseId,
                    location: stock.locationId,
                    lot: stock.lotId,
                },
            })
        },
        openBatchDetails(batch) {
            if (!batch?.isRegisteredBatch) return
            this.selectedBatchDetails = this.store.findBatch(batch.batchGroupId)
        },
        closeBatchDetails() {
            this.selectedBatchDetails = null
        },
        viewBatchProduct(productId) {
            this.closeBatchDetails()
            this.$emit('view-product', productId)
        },
        shipBatch(batchOrId) {
            const batch = typeof batchOrId === 'object' ? batchOrId : null
            const batchId = batch?.id || batchOrId
            this.close()
            this.$router.push({ name: 'dispatch', query: { mode: 'ship', source: 'batch', batch: batchId } })
        },
        toggleBatch(batchId) {
            this.expandedBatchIds[batchId] = !this.expandedBatchIds[batchId]
        },
        batchExpanded(batchId) {
            return Boolean(this.expandedBatchIds[batchId])
        },
        formatDate(value) {
            if (!value) return '—'
            const date = new Date(`${value}T00:00:00`)
            if (Number.isNaN(date.getTime())) return value
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(date)
        },
        unitStatusLabel(status) {
            return String(status || 'available')
                .replaceAll('_', ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase())
        },
        openUnit(unit, batch) {
            this.selectedUnit = unit
            this.selectedUnitBatch = batch
            this.selectedUnitBarcode = ''
            if (!unit?.code) return
            try {
                this.selectedUnitBarcode = barcodeDataUrl(unit.code, {
                    width: 3.2,
                    height: 130,
                    fontSize: 22,
                })
            } catch {
                this.store.addToast('Unit barcode unavailable.', 'danger')
            }
        },
        closeUnit() {
            this.selectedUnit = null
            this.selectedUnitBatch = null
            this.selectedUnitBarcode = ''
        },
        printUnitLabel() {
            if (!this.selectedUnit || !this.selectedUnitBarcode || !this.canPrint) return
            const unit = this.selectedUnit
            const batch = this.selectedUnitBatch
            const safe = (value) =>
                String(value || '')
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
            const printWindow = window.open('', '_blank', 'width=720,height=640')
            if (!printWindow) {
                this.store.addToast('Allow pop-ups to print.', 'danger')
                return
            }
            printWindow.document.write(`<!doctype html><html><head><title>${safe(unit.code)}</title><style>
                @page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{min-height:273mm;margin:0;display:grid;place-items:center;font-family:Arial,sans-serif;color:#122f33}
                .label{width:150mm;height:100mm;border:.5mm solid #122f33;padding:8mm;display:grid;grid-template-rows:auto auto 1fr auto;gap:4mm}
                .top{display:flex;justify-content:space-between;gap:6mm}.name{font-size:26pt;font-weight:800}.unit{font-size:20pt;font-weight:800;color:#008f91}
                .meta{display:grid;grid-template-columns:1fr 1fr;gap:2mm 8mm;font-size:13pt}.meta b{display:block;font-size:9pt;text-transform:uppercase;color:#61787b}
                .barcode{display:grid;place-items:center}img{width:100%;height:45mm;object-fit:contain}.code{text-align:center;font:700 16pt monospace}
            </style></head><body><div class="label"><div class="top"><span class="name">${safe(this.product.name)}</span><span class="unit">${safe(unit.ordinal)}/${safe(unit.receiptQuantity)}</span></div>
                <div class="meta"><span><b>Product</b>${safe(this.product.sku)}</span><span><b>Batch</b>${safe(batch?.batchNumber || unit.batchId || '—')}</span><span><b>Warehouse</b>${safe(unit.warehouseName)}</span><span><b>Location</b>${safe(unit.location)}</span></div>
                <div class="barcode"><img src="${this.selectedUnitBarcode}" alt=""></div><div class="code">${safe(unit.code)}</div>
            </div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
            printWindow.document.close()
        },
    },
}
</script>

<style scoped src="@/assets/css/components/product-details-modal.css"></style>
