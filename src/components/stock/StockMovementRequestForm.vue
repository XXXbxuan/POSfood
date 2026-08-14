<template>
    <main class="smr-page">
        <header class="smr-head">
            <div class="page-title-row">
                <button v-if="canReturnToSource" class="page-back-link" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i><span>Back</span>
                </button>
                <div>
                    <h1 class="inventory-page-title">Stock Movement</h1>
                </div>
            </div>
        </header>


        <section class="smr-card">
            <template v-if="step === 1">
                <header class="smr-card-head">
                    <span><i class="fa-solid fa-warehouse"></i></span>
                    <div><strong>Source warehouse</strong></div>
                </header>

                <div class="smr-body smr-source-step">
                    <div class="smr-source-grid">
                        <label>
                            <span>Warehouse *</span>
                            <ScrollableSelect v-model="sourceWarehouseId">
                                <option value="" disabled>Select source warehouse</option>
                                <option v-for="warehouse in activeWarehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
                            </ScrollableSelect>
                        </label>
                        <article class="smr-address-card">
                            <span><i class="fa-solid fa-location-dot"></i></span>
                            <div>
                                <p>{{ sourceWarehouse?.address || 'Address not set' }}</p>
                            </div>
                            <button type="button" class="smr-address-edit" aria-label="Edit source warehouse address" :disabled="!sourceWarehouse" @click="openAddressEditor('source')">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        </article>
                    </div>

                    <section class="smr-stock-builder" :class="{ disabled: !sourceWarehouseId }">
                        <header>
                            <div><strong>Stock to move</strong><small>{{ selectedItemCount }} selected</small></div>
                            <nav aria-label="Add stock type">
                                <button type="button" :class="{ active: addMode === 'product' }" @click="addMode = 'product'"><i class="fa-solid fa-box"></i>Products</button>
                                <button type="button" :class="{ active: addMode === 'batch' }" @click="addMode = 'batch'"><i class="fa-solid fa-layer-group"></i>Batches</button>
                            </nav>
                        </header>

                        <div v-if="addMode === 'product'" class="smr-add-row">
                            <label><span>Product</span><ScrollableSelect v-model="draftProductId" :disabled="!sourceWarehouseId"><option value="">Select product</option><option v-for="product in availableProducts" :key="product.id" :value="product.id">{{ product.name }} — {{ product.sku }}</option></ScrollableSelect></label>
                            <button type="button" class="button secondary" :disabled="!draftProductId" @click="addProduct"><i class="fa-solid fa-plus"></i>Add Product</button>
                        </div>
                        <div v-else class="smr-add-row">
                            <label><span>Registered Batch</span><ScrollableSelect v-model="draftBatchId" :disabled="!sourceWarehouseId"><option value="">Select batch</option><option v-for="batch in availableBatches" :key="batch.id" :value="batch.id">{{ batch.id }} — {{ batch.availableBatchCount }} batch{{ batch.availableBatchCount === 1 ? '' : 'es' }}</option></ScrollableSelect></label>
                            <button type="button" class="button secondary" :disabled="!draftBatchId" @click="addBatch"><i class="fa-solid fa-plus"></i>Add Batch</button>
                        </div>

                        <div v-if="selectedItems.length" class="smr-selected-list">
                            <article v-for="(item, index) in selectedItems" :key="item.key" class="smr-selected-item" :class="`is-${item.kind}`">
                                <span class="smr-item-icon"><i class="fa-solid" :class="item.kind === 'batch' ? 'fa-layer-group' : 'fa-box'"></i></span>
                                <div class="smr-item-main">
                                    <strong>{{ itemLabel(item) }}</strong>
                                    <small>{{ itemSubLabel(item) }}</small>
                                </div>
                                <label class="smr-inline-field">
                                    <span>Source location *</span>
                                    <ScrollableSelect v-if="item.kind === 'product'" v-model="item.sourceLocationId" @change="fillProductQuantity(item)">
                                        <option value="" disabled>Select location</option>
                                        <option v-for="row in productLocationOptions(item.productId)" :key="row.location.id" :value="row.location.id">{{ row.location.name }} · {{ formatQuantity(row.quantity) }} {{ row.unit }}</option>
                                    </ScrollableSelect>
                                    <ScrollableSelect v-else v-model="item.sourceLocationId" @change="fillBatchQuantity(item)">
                                        <option value="" disabled>Select location</option>
                                        <option v-for="row in batchLocationOptions(item.batchId)" :key="row.location.id" :value="row.location.id">{{ row.location.name }} · {{ row.availableBatchCount }} batch{{ row.availableBatchCount === 1 ? '' : 'es' }}</option>
                                    </ScrollableSelect>
                                </label>
                                <label class="smr-inline-field quantity">
                                    <span>Quantity * <small v-if="item.sourceLocationId">{{ item.kind === 'batch' ? batchLineAvailable(item) : formatQuantity(productLineAvailable(item)) }} available</small></span>
                                    <input v-if="item.kind === 'product'" v-model.number="item.quantity" type="number" :min="productStep(item.productId)" :max="productLineAvailable(item)" :step="productStep(item.productId)" />
                                    <input v-else v-model.number="item.batchCount" type="number" min="1" :max="batchLineAvailable(item)" step="1" />
                                </label>
                                <button type="button" class="smr-remove" aria-label="Remove item" @click="selectedItems.splice(index, 1)"><i class="fa-solid fa-xmark"></i></button>
                            </article>
                        </div>
                        <div v-else class="smr-empty"><i class="fa-solid fa-box-open"></i><strong>No stock selected</strong></div>
                    </section>
                </div>
            </template>

            <template v-else-if="step === 2">
                <header class="smr-card-head">
                    <span><i class="fa-solid fa-location-dot"></i></span>
                    <div><strong>Destination settings</strong></div>
                </header>

                <div class="smr-body smr-destination-step">
                    <div class="smr-destination-grid">
                        <label><span>Destination warehouse *</span><ScrollableSelect v-model="destinationWarehouseId"><option value="" disabled>Select destination warehouse</option><option v-for="warehouse in destinationWarehouseOptions" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option></ScrollableSelect></label>
                        <label><span>Destination location *</span><ScrollableSelect v-model="destinationLocationId" :disabled="!destinationWarehouseId"><option value="" disabled>Select destination location</option><option v-for="location in destinationLocations" :key="location.id" :value="location.id">{{ location.name }}</option></ScrollableSelect></label>
                        <label><span>Reason *</span><ScrollableSelect v-model="reason"><option>Warehouse stock movement</option><option>Replenishment</option><option>Return movement</option><option>Inspection movement</option><option>Other</option></ScrollableSelect></label>
                        <label><span>Reference</span><input v-model.trim="reference" class="mono" placeholder="Optional" /></label>
                        <label class="full"><span>Remark</span><textarea v-model.trim="remark" rows="2" placeholder="Optional"></textarea></label>
                    </div>
                </div>
            </template>

            <template v-else>
                <header class="smr-card-head">
                    <span><i class="fa-solid fa-truck-fast"></i></span>
                    <div><strong>Movement cart</strong></div>
                </header>

                <div class="smr-body smr-review-step">
                    <section class="smr-route">
                        <article>
                            <small>FROM</small>
                            <strong>{{ sourceWarehouse?.name }}</strong>
                            <p>{{ sourceWarehouse?.address || 'Address not set' }}</p>
                            <button type="button" class="smr-route-edit" aria-label="Edit source address" @click="openAddressEditor('source')"><i class="fa-solid fa-pen"></i></button>
                        </article>
                        <span><i class="fa-solid fa-arrow-right"></i></span>
                        <article>
                            <small>TO</small>
                            <strong>{{ destinationWarehouse?.name }}</strong>
                            <p>{{ destinationWarehouse?.address || 'Address not set' }}</p>
                            <button type="button" class="smr-route-edit" aria-label="Edit destination address" @click="openAddressEditor('destination')"><i class="fa-solid fa-pen"></i></button>
                        </article>
                    </section>
                    <section class="smr-review-stock">
                        <header>
                            <span class="smr-review-count"><i class="fa-solid fa-boxes-stacked"></i><strong>{{ selectedItemCount }}</strong></span>
                            <span v-if="reference" class="mono">{{ reference }}</span>
                        </header>
                        <div>
                            <article v-for="item in selectedItems" :key="`review-${item.key}`">
                                <span><i class="fa-solid" :class="item.kind === 'batch' ? 'fa-layer-group' : 'fa-box'"></i></span>
                                <div><strong>{{ itemLabel(item) }}</strong><small>{{ reviewSubLabel(item) }}</small></div>
                                <b>{{ reviewQuantity(item) }}</b>
                            </article>
                        </div>
                    </section>
                </div>
            </template>

            <p v-if="error" class="smr-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
            <footer class="smr-actions">
                <button v-if="step > 1" class="button secondary" type="button" @click="step -= 1"><i class="fa-solid fa-arrow-left"></i>Previous</button>
                <span></span>
                <button class="button primary" type="button" :disabled="step === 1 ? !canContinue : !canCreate" @click="step === 1 ? nextStep() : step === 2 ? reviewCart() : completeMovement()">
                    {{ step === 1 ? 'Next' : step === 2 ? 'Review' : 'Confirm Movement' }}
                    <i class="fa-solid" :class="step === 3 ? 'fa-check' : 'fa-arrow-right'"></i>
                </button>
            </footer>
        </section>

        <div v-if="addressEditOpen" class="modal-backdrop" @click.self="closeAddressEditor">
            <section class="form-modal smr-address-modal" role="dialog" aria-modal="true" aria-label="Edit warehouse address">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">WAREHOUSE ADDRESS</span>
                        <h2>{{ addressEditWarehouse?.name || 'Warehouse' }}</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeAddressEditor"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="smr-address-modal-body">
                    <label>
                        <span>Address *</span>
                        <textarea v-model.trim="addressDraft" rows="5" placeholder="Enter full warehouse / delivery address"></textarea>
                    </label>
                    <p v-if="addressError" class="smr-error"><i class="fa-solid fa-circle-exclamation"></i>{{ addressError }}</p>
                </div>
                <footer class="form-actions">
                    <button class="button secondary" type="button" @click="closeAddressEditor">Cancel</button>
                    <span></span>
                    <button class="button primary" type="button" @click="saveAddress"><i class="fa-solid fa-check"></i>Save</button>
                </footer>
            </section>
        </div>

    </main>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'StockMovementRequestForm',
    data() {
        return {
            store: inventoryStore,
            step: 1,
            addMode: 'product',
            sourceWarehouseId: String(this.$route.query.warehouse || ''),
            destinationWarehouseId: '',
            destinationLocationId: '',
            draftProductId: '',
            draftBatchId: '',
            selectedItems: [],
            reason: 'Warehouse stock movement',
            reference: '',
            remark: '',
            error: '',
            addressEditOpen: false,
            addressEditTarget: 'source',
            addressDraft: '',
            addressError: '',
        }
    },
    computed: {
        activeWarehouses() { return this.store.state.warehouses.filter((warehouse) => warehouse.active !== false) },
        sourceWarehouse() { return this.store.findWarehouse(this.sourceWarehouseId) },
        destinationWarehouse() { return this.store.findWarehouse(this.destinationWarehouseId) },
        addressEditWarehouse() { return this.addressEditTarget === 'destination' ? this.destinationWarehouse : this.sourceWarehouse },
        destinationWarehouseOptions() { return this.activeWarehouses },
        destinationLocations() {
            const sourceIds = new Set(this.selectedItems.map((item) => String(item.sourceLocationId || '')).filter(Boolean))
            return (this.destinationWarehouse?.locations || []).filter((location) => {
                if (location.active === false || location.status === 'unavailable') return false
                return this.destinationWarehouseId !== this.sourceWarehouseId || !sourceIds.has(String(location.id))
            })
        },
        availableProducts() {
            if (!this.sourceWarehouseId) return []
            const selected = new Set(this.selectedItems.filter((item) => item.kind === 'product').map((item) => item.productId))
            return this.store.state.products.filter((product) => product.active && !selected.has(product.id) && this.store.productStock(product.id, { warehouseId: this.sourceWarehouseId, stockSource: 'standalone' }) > 0)
        },
        availableBatches() {
            if (!this.sourceWarehouseId) return []
            const selected = new Set(this.selectedItems.filter((item) => item.kind === 'batch').map((item) => item.batchId))
            return this.store.batchGroups({ availableOnly: true }).map((batch) => {
                let availability = null
                try { availability = this.store.batchWarehouseAvailability(batch.id, this.sourceWarehouseId) } catch { return null }
                return availability && availability.availableBatchCount > 0 ? { ...batch, availableBatchCount: availability.availableBatchCount } : null
            }).filter((batch) => batch && !selected.has(batch.id))
        },
        selectedItemCount() { return this.selectedItems.length },
        productCount() { return this.selectedItems.filter((item) => item.kind === 'product').length },
        batchCount() { return this.selectedItems.filter((item) => item.kind === 'batch').length },
        canContinue() {
            if (!this.sourceWarehouseId || !this.selectedItems.length) return false
            return this.selectedItems.every((item) => {
                if (item.kind === 'batch') return item.sourceLocationId && Number(item.batchCount) >= 1 && Number(item.batchCount) <= this.batchLineAvailable(item)
                return item.sourceLocationId && Number(item.quantity) > 0 && Number(item.quantity) <= this.productLineAvailable(item)
            })
        },
        canCreate() {
            return this.canContinue
                && Boolean(this.destinationWarehouseId)
                && Boolean(this.destinationLocationId)
        },
        canReturnToSource() {
            return ['dashboard', 'warehouses', 'scan'].includes(String(this.$route.query.from || ''))
        },
    },
    watch: {
        sourceWarehouseId(value, oldValue) {
            if (oldValue && value !== oldValue) this.selectedItems = []
            this.draftProductId = ''
            this.draftBatchId = ''
        },
        destinationWarehouseId() { this.destinationLocationId = '' },
    },
    mounted() {
        this.prefillRouteStock()
    },
    methods: {
        prefillRouteStock() {
            if (!this.sourceWarehouseId || this.selectedItems.length) return
            const batchId = String(this.$route.query.batch || '')
            if (batchId) {
                const batch = this.store.findBatch(batchId)
                if (!batch) return
                const locations = this.batchLocationOptions(batch.id)
                const requestedLocationId = String(this.$route.query.location || '')
                const requestedLocation = locations.find((row) => String(row.location.id) === requestedLocationId)
                const selectedLocation = requestedLocation || (locations.length === 1 ? locations[0] : null)
                this.addMode = 'batch'
                this.selectedItems.push({
                    key: `batch-${batch.id}-${Date.now()}`,
                    kind: 'batch',
                    batchId: batch.id,
                    sourceLocationId: selectedLocation?.location?.id || '',
                    batchCount: selectedLocation?.availableBatchCount || '',
                })
                return
            }

            const productId = String(this.$route.query.product || '')
            if (!productId) return
            const product = this.store.findProduct(productId)
            if (!product) return
            const locations = this.productLocationOptions(product.id)
            const requestedLocationId = String(this.$route.query.location || '')
            const requestedLocation = locations.find((row) => String(row.location.id) === requestedLocationId)
            const selectedLocation = requestedLocation || (locations.length === 1 ? locations[0] : null)
            this.addMode = 'product'
            this.selectedItems.push({
                key: `product-${product.id}-${Date.now()}`,
                kind: 'product',
                productId: product.id,
                sourceLocationId: selectedLocation?.location?.id || '',
                quantity: selectedLocation?.quantity || '',
            })
        },
        openAddressEditor(target = 'source') {
            this.addressEditTarget = target === 'destination' ? 'destination' : 'source'
            const warehouse = this.addressEditWarehouse
            if (!warehouse) return
            this.addressDraft = String(warehouse.address || '')
            this.addressError = ''
            this.addressEditOpen = true
        },
        closeAddressEditor() {
            this.addressEditOpen = false
            this.addressError = ''
        },
        saveAddress() {
            const address = String(this.addressDraft || '').trim()
            if (!address) {
                this.addressError = 'Warehouse address is required.'
                return
            }
            try {
                const warehouse = this.addressEditWarehouse
                if (!warehouse) throw new Error('Warehouse not found.')
                this.store.saveWarehouse({ ...warehouse, address }, warehouse.id)
                this.addressEditOpen = false
                this.addressError = ''
                this.error = ''
                this.store.addToast(`${warehouse.name} address updated.`)
            } catch (error) {
                this.addressError = error.message
            }
        },
        goBack() {
            if (this.$route.query.from === 'warehouses') this.$router.push({ name: 'warehouses' })
            else this.$router.push({ name: 'dashboard' })
        },
        productLocationOptions(productId) {
            if (!productId || !this.sourceWarehouseId) return []
            const product = this.store.findProduct(productId)
            const grouped = new Map()
            this.store.stockPositionsFor(productId, { warehouseId: this.sourceWarehouseId, stockSource: 'standalone' }).filter((position) => Number(position.availableQuantity) > 0).forEach((position) => grouped.set(position.locationId, (grouped.get(position.locationId) || 0) + Number(position.availableQuantity)))
            return [...grouped.entries()].map(([locationId, quantity]) => ({ location: this.store.findLocation(this.sourceWarehouseId, locationId), quantity, unit: product?.unit || '' })).filter((row) => row.location)
        },
        productLineAvailable(item) {
            if (!item?.sourceLocationId) return 0
            return this.store.productStock(item.productId, { warehouseId: this.sourceWarehouseId, locationId: item.sourceLocationId, stockSource: 'standalone' })
        },
        productStep(productId) { return this.store.findProduct(productId)?.trackingMode === 'unit' ? 1 : 0.01 },
        fillProductQuantity(item) {
            const available = this.productLineAvailable(item)
            item.quantity = available > 0 ? available : ''
        },
        batchLocationOptions(batchId) {
            if (!batchId || !this.sourceWarehouseId) return []
            return (this.sourceWarehouse?.locations || [])
                .filter((location) => location.active !== false && location.status !== 'unavailable')
                .map((location) => {
                    try {
                        const availability = this.store.batchWarehouseAvailability(batchId, this.sourceWarehouseId, location.id)
                        return availability.availableBatchCount > 0 ? { location, availableBatchCount: availability.availableBatchCount } : null
                    } catch { return null }
                })
                .filter(Boolean)
        },
        batchLineAvailable(item) {
            if (!item?.batchId || !item?.sourceLocationId) return 0
            try { return this.store.batchWarehouseAvailability(item.batchId, this.sourceWarehouseId, item.sourceLocationId).availableBatchCount } catch { return 0 }
        },
        fillBatchQuantity(item) {
            const available = this.batchLineAvailable(item)
            item.batchCount = available > 0 ? available : ''
        },
        batchAvailableCount(batchId) {
            if (!batchId || !this.sourceWarehouseId) return 0
            try { return this.store.batchWarehouseAvailability(batchId, this.sourceWarehouseId).availableBatchCount } catch { return 0 }
        },
        addProduct() {
            const product = this.store.findProduct(this.draftProductId)
            if (!product) return
            const locations = this.productLocationOptions(product.id)
            this.selectedItems.push({ key: `product-${product.id}-${Date.now()}`, kind: 'product', productId: product.id, sourceLocationId: locations.length === 1 ? locations[0].location.id : '', quantity: locations.length === 1 ? locations[0].quantity : '' })
            this.draftProductId = ''
        },
        addBatch() {
            const batch = this.store.findBatch(this.draftBatchId)
            if (!batch) return
            const locations = this.batchLocationOptions(batch.id)
            this.selectedItems.push({
                key: `batch-${batch.id}-${Date.now()}`,
                kind: 'batch',
                batchId: batch.id,
                sourceLocationId: locations.length === 1 ? locations[0].location.id : '',
                batchCount: locations.length === 1 ? locations[0].availableBatchCount : '',
            })
            this.draftBatchId = ''
        },
        itemLabel(item) { return item.kind === 'batch' ? `Batch ${item.batchId}` : (this.store.findProduct(item.productId)?.name || 'Product') },
        itemSubLabel(item) {
            if (item.kind === 'batch') {
                const batch = this.store.findBatch(item.batchId)
                return `${batch?.productCount || 0} products · ${this.batchAvailableCount(item.batchId)} batches available`
            }
            const product = this.store.findProduct(item.productId)
            return product ? `${product.sku} · ${product.unit}` : 'Product'
        },
        reviewSubLabel(item) {
            if (item.kind === 'batch') { const location = this.store.findLocation(this.sourceWarehouseId, item.sourceLocationId); return `${location?.name || 'Location'} · ${item.batchCount} batch${Number(item.batchCount) === 1 ? '' : 'es'}` }
            const location = this.store.findLocation(this.sourceWarehouseId, item.sourceLocationId)
            return `${location?.name || 'Location'} · ${this.store.findProduct(item.productId)?.sku || ''}`
        },
        reviewQuantity(item) {
            if (item.kind === 'batch') {
                const batch = this.store.findBatch(item.batchId)
                const parts = (batch?.items || []).reduce((sum, recipe) => sum + Number(recipe.recipeQuantity || 0) * Number(item.batchCount || 0), 0)
                return `${this.formatQuantity(parts)} parts`
            }
            return `${this.formatQuantity(item.quantity)} ${this.store.findProduct(item.productId)?.unit || ''}`
        },
        formatQuantity(value) { return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0) },
        nextStep() {
            this.error = ''
            if (!this.canContinue) { this.error = 'Complete every selected stock line before continuing.'; return }
            this.step = 2
        },
        reviewCart() {
            this.error = ''
            if (!this.destinationLocationId) { this.error = 'Select the destination location.'; return }
            if (!this.canCreate) { this.error = 'Complete the destination details.'; return }
            this.step = 3
        },
        completeMovement() {
            this.error = ''
            if (!this.destinationLocationId) { this.error = 'Select the destination location.'; return }
            if (!this.canCreate) { this.error = 'Complete the destination details.'; return }
            try {
                const movement = this.store.executeStockMovement({
                    sourceWarehouseId: this.sourceWarehouseId,
                    destinationWarehouseId: this.destinationWarehouseId,
                    destinationLocationId: this.destinationLocationId,
                    items: this.selectedItems.map((item) => item.kind === 'batch'
                        ? { kind: 'batch', batchId: item.batchId, sourceLocationId: item.sourceLocationId, batchCount: Number(item.batchCount) }
                        : { kind: 'product', productId: item.productId, sourceLocationId: item.sourceLocationId, quantity: Number(item.quantity) }),
                    reason: this.reason,
                    reference: this.reference,
                    remark: this.remark,
                })
                this.store.addToast(`${movement.id} completed.`)
                this.$router.push({ name: 'history' })
            } catch (error) { this.error = error.message }
        },
    },
}
</script>

<style scoped src="@/assets/css/components/stock-movement-request-form.css"></style>
