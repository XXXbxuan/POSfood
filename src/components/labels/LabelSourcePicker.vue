<template>
    <section class="lsp-panel">
        <button
            class="lsp-source-card"
            :class="{ selected: selectedCount > 0, disabled: Boolean(selectedBatchId) }"
            type="button"
            :disabled="locked || Boolean(selectedBatchId)"
            @click="openDialog('products')"
        >
            <span class="lsp-source-icon"><i class="fa-solid fa-boxes-stacked"></i></span>
            <span class="lsp-source-copy"><strong>Products</strong><b>{{ selectedCount }}</b></span>
            <span v-if="selectedCount && !locked" class="lsp-source-clear" role="button" tabindex="0" aria-label="Clear products" @click.stop="clearProducts" @keydown.enter.stop="clearProducts"><i class="fa-solid fa-xmark"></i></span>
            <i v-else class="fa-solid fa-chevron-right"></i>
        </button>

        <button
            class="lsp-source-card"
            :class="{ selected: selectedBatch, disabled: selectedCount > 0 }"
            type="button"
            :disabled="locked || selectedCount > 0"
            @click="openDialog('batches')"
        >
            <span class="lsp-source-icon"><i class="fa-solid fa-layer-group"></i></span>
            <span class="lsp-source-copy"><strong>Batches</strong><b>{{ selectedBatch ? 1 : 0 }}</b></span>
            <span v-if="selectedBatch && !locked" class="lsp-source-clear" role="button" tabindex="0" aria-label="Clear batch" @click.stop="clearBatch" @keydown.enter.stop="clearBatch"><i class="fa-solid fa-xmark"></i></span>
            <i v-else class="fa-solid fa-chevron-right"></i>
        </button>

        <Teleport to="body">
            <div v-if="dialog" class="lsp-modal-backdrop" @click.self="closeDialog">
                <section class="lsp-modal" role="dialog" aria-modal="true" :aria-label="dialogTitle">
                    <header class="lsp-modal-header">
                        <span class="lsp-modal-icon"><i class="fa-solid" :class="dialog === 'products' ? 'fa-boxes-stacked' : 'fa-layer-group'"></i></span>
                        <h3>{{ dialogTitle }}</h3>
                        <button type="button" aria-label="Close selector" @click="closeDialog"><i class="fa-solid fa-xmark"></i></button>
                    </header>

                    <div v-if="dialog === 'products'" class="lsp-modal-body">
                        <div class="lsp-list">
                            <article v-for="product in products" :key="product.id" class="lsp-product" :class="{ selected: quantityFor(product.id) > 0 }">
                                <div class="lsp-product-main">
                                    <button class="lsp-product-identity" type="button" @click="selectProduct(product)">
                                        <span class="lsp-photo"><img v-if="product.photo" :src="product.photo" :alt="product.name" /><b v-else>{{ initials(product.name) }}</b></span>
                                        <span><strong>{{ product.name }}</strong><small>{{ product.sku }}</small></span>
                                    </button>
                                    <div v-if="quantityFor(product.id) > 0" class="lsp-inline-counter">
                                        <button v-if="product.trackingMode !== 'unit'" type="button" :aria-label="`Decrease ${product.name}`" @click="step(product, -1)"><i class="fa-solid fa-chevron-left"></i></button>
                                        <button v-else type="button" :aria-label="`Choose ${product.name} units`" @click="openUnitPicker(product)"><i class="fa-solid fa-list-check"></i></button>
                                        <strong>{{ quantityFor(product.id) }}/{{ wholeStock(product) }}</strong>
                                        <button v-if="product.trackingMode !== 'unit'" type="button" :aria-label="`Increase ${product.name}`" @click="step(product, 1)"><i class="fa-solid fa-chevron-right"></i></button>
                                        <button v-else type="button" :aria-label="`Choose ${product.name} units`" @click="openUnitPicker(product)"><i class="fa-solid fa-chevron-right"></i></button>
                                    </div>
                                    <button v-else class="lsp-stock-button" type="button" @click="selectProduct(product)">
                                        <strong>{{ wholeStock(product) }}</strong><small>{{ product.unit }}</small><i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                                <button v-if="quantityFor(product.id) > 0 && product.trackingMode !== 'unit' && layersFor(product.id).length > 1" class="lsp-layer-button" type="button" @click="openLayerPicker(product)">
                                    <i class="fa-solid fa-layer-group"></i><span>{{ selectedLayerCount(product.id) }} layers</span><i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </article>
                        </div>
                    </div>

                    <div v-else class="lsp-modal-body">
                        <div v-if="batches.length" class="lsp-boxes">
                            <article v-for="batch in batches" :key="batch.id" class="lsp-box" :class="{ selected: batch.id === selectedBatchId }">
                                <button type="button" class="lsp-box-main" @click="selectBatch(batch)">
                                    <span><i class="fa-solid fa-layer-group"></i></span>
                                    <span><strong>{{ batch.name }}</strong><small>{{ batch.items.length }} products · {{ batchQuantity(batch) }} items</small></span>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                                <div v-if="batch.id === selectedBatchId" class="lsp-batch-items">
                                    <div class="lsp-batch-items-heading"><strong>Complete batches</strong></div>
                                    <div class="lsp-complete-batch-counter">
                                        <button type="button" :disabled="batchSetCount(batch) <= 1" @click="stepBatchCount(batch, -1)"><i class="fa-solid fa-minus"></i></button>
                                        <strong>{{ batchSetCount(batch) }} / {{ batch.availableBatchCount || 0 }}</strong>
                                        <button type="button" :disabled="batchSetCount(batch) >= (batch.availableBatchCount || 0)" @click="stepBatchCount(batch, 1)"><i class="fa-solid fa-plus"></i></button>
                                    </div>
                                    <article v-for="item in batch.items" :key="batchItemKey(item)" class="lsp-batch-item" :class="{ selected: batchQuantityFor(item) > 0 }">
                                        <span class="lsp-photo"><img v-if="batchProduct(item.productId)?.photo" :src="batchProduct(item.productId).photo" :alt="batchProduct(item.productId).name" /><b v-else>{{ initials(batchProduct(item.productId)?.name) }}</b></span>
                                        <span class="lsp-batch-item-copy"><strong>{{ batchProduct(item.productId)?.name || 'Product' }}</strong><small>{{ item.recipeQuantity || 1 }} {{ batchProduct(item.productId)?.unit || 'pcs' }} per batch</small></span>
                                        <strong>{{ batchQuantityFor(item) }} {{ batchProduct(item.productId)?.unit || 'pcs' }}</strong>
                                    </article>
                                </div>
                            </article>
                        </div>
                        <div v-else class="lsp-empty"><i class="fa-solid fa-layer-group"></i><strong>No batches</strong></div>
                    </div>

                    <footer class="lsp-modal-footer"><span>{{ dialog === 'products' ? `${selectedCount} selected` : selectedBatch ? selectedBatch.name : 'No batch selected' }}</span><button type="button" @click="finishDialog">Next</button></footer>
                </section>
            </div>

            <div v-if="unitPickerProduct" class="lsp-modal-backdrop lsp-nested-backdrop" @click.self="closeUnitPicker">
                <section class="lsp-modal lsp-unit-modal" role="dialog" aria-modal="true" aria-label="Select physical units">
                    <header class="lsp-modal-header">
                        <span class="lsp-modal-icon"><i class="fa-solid fa-barcode"></i></span>
                        <h3>{{ unitPickerProduct.name }}</h3>
                        <button type="button" aria-label="Close units" @click="closeUnitPicker"><i class="fa-solid fa-xmark"></i></button>
                    </header>
                    <div class="lsp-unit-layout">
                        <aside class="lsp-unit-sidebar" v-if="unitPickerLocations.length">
                            <article
                                v-for="location in unitPickerLocations"
                                :key="location.key"
                                class="lsp-unit-sidebar-item"
                                :class="{ active: location.key === unitPickerLocationKey }"
                                @click="unitPickerLocationKey = location.key"
                            >
                                <span><i class="fa-solid fa-location-dot"></i></span>
                                <div>
                                    <strong>{{ location.name }}</strong>
                                    <small>{{ location.units.length }} units</small>
                                </div>
                                <label>
                                    <small>Qty</small>
                                    <input
                                        :value="selectedLocationUnitCount(location)"
                                        type="number"
                                        min="0"
                                        :max="location.units.length"
                                        inputmode="numeric"
                                        @click.stop
                                        @input="setLocationUnitQuantity(location, $event.target.value)"
                                    />
                                </label>
                            </article>
                        </aside>
                        <div class="lsp-modal-body lsp-unit-list">
                            <button v-for="unit in visibleUnitPickerUnits" :key="unit.id" type="button" :class="{ selected: isUnitSelected(unitPickerProduct.id, unit.id) }" @click="toggleUnit(unitPickerProduct, unit)">
                                <span><b>{{ unit.ordinal || unit.batchOrdinal || '—' }}/{{ unit.receiptQuantity || wholeStock(unitPickerProduct) }}</b><small>{{ unit.code }}</small></span>
                                <span><small>{{ unit.location || unit.locationName || '—' }}</small><i class="fa-solid" :class="isUnitSelected(unitPickerProduct.id, unit.id) ? 'fa-circle-check' : 'fa-circle' "></i></span>
                            </button>
                        </div>
                    </div>
                    <footer class="lsp-modal-footer"><span>{{ selectedUnitsFor(unitPickerProduct.id).length }}/{{ unitsFor(unitPickerProduct.id).length }}</span><button type="button" @click="closeUnitPicker">Done</button></footer>
                </section>
            </div>

            <div v-if="layerPickerProduct" class="lsp-modal-backdrop lsp-nested-backdrop" @click.self="closeLayerPicker">
                <section class="lsp-modal lsp-layer-modal" role="dialog" aria-modal="true" aria-label="Select receipt layers">
                    <header class="lsp-modal-header">
                        <span class="lsp-modal-icon"><i class="fa-solid fa-layer-group"></i></span>
                        <h3>{{ layerPickerProduct.name }}</h3>
                        <button type="button" aria-label="Close layers" @click="closeLayerPicker"><i class="fa-solid fa-xmark"></i></button>
                    </header>
                    <div class="lsp-modal-body lsp-layer-list">
                        <article v-for="layer in layersFor(layerPickerProduct.id)" :key="layer.id">
                            <span><strong>{{ layer.batchNumber || layer.id }}</strong><small>{{ layer.receivedDate || '—' }} · {{ layer.expiryDate || '—' }}</small></span>
                            <div class="lsp-batch-stepper">
                                <button type="button" @click="stepLayer(layerPickerProduct, layer, -layerStep(layerPickerProduct))"><i class="fa-solid fa-minus"></i></button>
                                <strong>{{ layerQuantity(layerPickerProduct.id, layer.id) }}/{{ layer.availableQuantity }}</strong>
                                <button type="button" @click="stepLayer(layerPickerProduct, layer, layerStep(layerPickerProduct))"><i class="fa-solid fa-plus"></i></button>
                            </div>
                        </article>
                    </div>
                    <footer class="lsp-modal-footer"><span>{{ quantityFor(layerPickerProduct.id) }} {{ layerPickerProduct.unit }}</span><button type="button" @click="closeLayerPicker">Done</button></footer>
                </section>
            </div>
        </Teleport>
    </section>
</template>

<script>
export default {
    name: 'LabelSourcePicker',
    props: {
        products: { type: Array, default: () => [] },
        batchProducts: { type: Array, default: () => [] },
        modelValue: { type: String, default: '' },
        quantities: { type: Object, default: () => ({}) },
        unitsByProduct: { type: Object, default: () => ({}) },
        selectedUnitIds: { type: Object, default: () => ({}) },
        receiptLayersByProduct: { type: Object, default: () => ({}) },
        receiptQuantities: { type: Object, default: () => ({}) },
        batches: { type: Array, default: () => [] },
        selectedBatchId: { type: String, default: '' },
        batchQuantities: { type: Object, default: () => ({}) },
        locked: { type: Boolean, default: false },
    },
    emits: ['update:modelValue', 'update:quantities', 'update:selected-unit-ids', 'update:receipt-quantities', 'update:batch-quantities', 'select-batch', 'clear-batch', 'proceed'],
    data() { return { dialog: '', unitPickerProductId: '', unitPickerLocationKey: '', layerPickerProductId: '' } },
    computed: {
        selectedCount() { return Object.values(this.quantities).filter((value) => Number(value) > 0).length },
        selectedBatch() { return this.batches.find((batch) => batch.id === this.selectedBatchId) || null },
        dialogTitle() { return this.dialog === 'products' ? 'Select products' : 'Select batch' },
        unitPickerProduct() { return this.products.find((product) => product.id === this.unitPickerProductId) || null },
        unitPickerLocations() {
            if (!this.unitPickerProduct) return []
            const groups = new Map()
            this.unitsFor(this.unitPickerProduct.id).forEach((unit) => {
                const key = String(unit.locationId || unit.positionId || unit.location || unit.locationName || 'unassigned')
                if (!groups.has(key)) groups.set(key, { key, name: unit.location || unit.locationName || 'Unassigned', units: [] })
                groups.get(key).units.push(unit)
            })
            return [...groups.values()]
        },
        visibleUnitPickerUnits() {
            const active = this.unitPickerLocations.find((location) => location.key === this.unitPickerLocationKey)
            return active?.units || this.unitPickerLocations[0]?.units || []
        },
        layerPickerProduct() { return this.products.find((product) => product.id === this.layerPickerProductId) || null },
    },
    methods: {
        openDialog(dialog) { if (!this.locked) this.dialog = dialog },
        closeDialog() { this.dialog = '' },
        finishDialog() {
            this.closeDialog()
            this.$emit('proceed')
        },
        clearBatch() { this.$emit('clear-batch') },
        clearProducts() {
            this.$emit('update:quantities', {})
            this.$emit('update:selected-unit-ids', {})
            this.$emit('update:receipt-quantities', {})
            this.$emit('update:modelValue', '')
        },
        initials(name) { return String(name || '').slice(0, 2).toUpperCase() },
        wholeStock(product) { return Math.max(0, Number(product?.stock) || 0) },
        quantityFor(productId) { return Math.max(0, Number(this.quantities[productId]) || 0) },
        batchItemKey(item) { return item.lotId || item.productId },
        batchQuantityFor(item) { return Math.max(0, Number(this.batchQuantities[this.batchItemKey(item)]) || 0) },
        batchProduct(productId) { return this.batchProducts.find((product) => product.id === productId) || null },
        unitsFor(productId) { return this.unitsByProduct[productId] || [] },
        selectedUnitsFor(productId) { return this.selectedUnitIds[productId] || [] },
        isUnitSelected(productId, unitId) { return this.selectedUnitsFor(productId).includes(unitId) },
        layersFor(productId) { return this.receiptLayersByProduct[productId] || [] },
        layerQuantity(productId, layerId) { return Math.max(0, Number(this.receiptQuantities[productId]?.[layerId]) || 0) },
        selectedLayerCount(productId) { return Object.values(this.receiptQuantities[productId] || {}).filter((quantity) => Number(quantity) > 0).length },
        selectProduct(product) {
            this.$emit('update:modelValue', product.id)
            if (product.trackingMode === 'unit') {
                this.openUnitPicker(product)
                return
            }
            if (this.quantityFor(product.id) > 0) return
            this.step(product, 1)
        },
        step(product, amount) {
            const available = this.wholeStock(product)
            const next = Math.max(0, Math.min(available, this.quantityFor(product.id) + amount))
            const quantities = { ...this.quantities, [product.id]: next }
            const allocations = { ...(this.receiptQuantities[product.id] || {}) }
            const layers = this.layersFor(product.id)
            if (amount > 0) {
                let remaining = next - Object.values(allocations).reduce((sum, value) => sum + Number(value || 0), 0)
                layers.forEach((layer) => {
                    if (!(remaining > 0)) return
                    const current = Number(allocations[layer.id] || 0)
                    const take = Math.min(remaining, Math.max(0, Number(layer.availableQuantity || 0) - current))
                    allocations[layer.id] = current + take
                    remaining -= take
                })
            } else {
                let remove = Object.values(allocations).reduce((sum, value) => sum + Number(value || 0), 0) - next
                layers.slice().reverse().forEach((layer) => {
                    if (!(remove > 0)) return
                    const current = Number(allocations[layer.id] || 0)
                    const take = Math.min(remove, current)
                    allocations[layer.id] = current - take
                    remove -= take
                })
            }
            this.$emit('update:quantities', quantities)
            this.$emit('update:receipt-quantities', { ...this.receiptQuantities, [product.id]: allocations })
        },
        openUnitPicker(product) {
            this.unitPickerProductId = product.id
            this.$nextTick(() => { this.unitPickerLocationKey = this.unitPickerLocations[0]?.key || '' })
        },
        closeUnitPicker() { this.unitPickerProductId = ''; this.unitPickerLocationKey = '' },
        selectedLocationUnitCount(location) {
            const selected = new Set(this.selectedUnitsFor(this.unitPickerProductId))
            return location.units.filter((unit) => selected.has(unit.id)).length
        },
        setLocationUnitQuantity(location, value) {
            const count = Math.max(0, Math.min(location.units.length, Number(value) || 0))
            const locationIds = new Set(location.units.map((unit) => unit.id))
            const retained = this.selectedUnitsFor(this.unitPickerProductId).filter((id) => !locationIds.has(id))
            const next = [...retained, ...location.units.slice(0, count).map((unit) => unit.id)]
            this.$emit('update:selected-unit-ids', { ...this.selectedUnitIds, [this.unitPickerProductId]: next })
            this.$emit('update:quantities', { ...this.quantities, [this.unitPickerProductId]: next.length })
            this.$emit('update:modelValue', next.length ? this.unitPickerProductId : this.modelValue)
        },
        setUnitQuantity(product, value) {
            const maximum = this.unitsFor(product.id).length
            const count = Math.max(0, Math.min(maximum, Number(value) || 0))
            const nextIds = this.unitsFor(product.id).slice(0, count).map((unit) => unit.id)
            const selectedUnitIds = { ...this.selectedUnitIds, [product.id]: nextIds }
            const quantities = { ...this.quantities, [product.id]: nextIds.length }
            const nextModelValue = nextIds.length ? product.id : this.modelValue
            this.$emit('update:selected-unit-ids', selectedUnitIds)
            this.$emit('update:quantities', quantities)
            this.$emit('update:modelValue', nextModelValue)
        },
        toggleUnit(product, unit) {
            const current = this.selectedUnitsFor(product.id)
            const next = current.includes(unit.id) ? current.filter((id) => id !== unit.id) : [...current, unit.id]
            const selectedUnitIds = { ...this.selectedUnitIds, [product.id]: next }
            const nextModelValue = this.products.find((candidate) => {
                if (candidate.trackingMode === 'unit') return (selectedUnitIds[candidate.id] || []).length > 0
                return this.quantityFor(candidate.id) > 0
            })?.id || ''
            this.$emit('update:selected-unit-ids', selectedUnitIds)
            this.$emit('update:quantities', { ...this.quantities, [product.id]: next.length })
            this.$emit('update:modelValue', next.length ? product.id : nextModelValue)
        },
        openLayerPicker(product) { this.layerPickerProductId = product.id },
        closeLayerPicker() { this.layerPickerProductId = '' },
        layerStep(product) { return String(product.unit || '').toLowerCase() === 'pcs' ? 1 : .5 },
        stepLayer(product, layer, amount) {
            const allocations = { ...(this.receiptQuantities[product.id] || {}) }
            const next = Math.max(0, Math.min(Number(layer.availableQuantity || 0), this.layerQuantity(product.id, layer.id) + amount))
            allocations[layer.id] = Math.round(next * 100) / 100
            const total = Object.values(allocations).reduce((sum, value) => sum + Number(value || 0), 0)
            this.$emit('update:receipt-quantities', { ...this.receiptQuantities, [product.id]: allocations })
            this.$emit('update:quantities', { ...this.quantities, [product.id]: total })
            this.$emit('update:modelValue', total > 0 ? product.id : this.modelValue === product.id ? '' : this.modelValue)
        },
        selectBatch(batch) { if (batch.id !== this.selectedBatchId) this.$emit('select-batch', batch) },
        batchSetCount(batch) {
            const first = batch.items?.[0]
            if (!first) return 0
            const perBatch = Math.max(0.0001, Number(first.recipeQuantity) || 1)
            return Math.max(1, Math.round(this.batchQuantityFor(first) / perBatch) || 1)
        },
        stepBatchCount(batch, amount) {
            const maximum = Math.max(1, Number(batch.availableBatchCount) || 1)
            const count = Math.max(1, Math.min(maximum, this.batchSetCount(batch) + amount))
            this.$emit('update:batch-quantities', Object.fromEntries(batch.items.map((item) => [
                this.batchItemKey(item),
                (Number(item.recipeQuantity) || 1) * count,
            ])))
        },
        batchQuantity(batch) { return batch.recipePartCount || batch.items.reduce((sum, item) => sum + Number(item.recipeQuantity || 1), 0) },
    },
}
</script>

<style scoped src="@/assets/css/components/label-source-picker.css"></style>
