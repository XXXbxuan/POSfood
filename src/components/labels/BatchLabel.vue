<template>
    <article class="batch-label" :class="[`label-${size}`, `orientation-${orientation}`, { 'is-editing': editing }]">
        <header>
            <span :class="targetClass('logo')" :style="transformStyle('logo')" @pointerdown.stop.prevent="selectElement($event, 'logo')"><i class="fa-solid fa-layer-group"></i></span>
            <strong :class="targetClass('brand')" :style="transformStyle('brand')" @pointerdown.stop.prevent="selectElement($event, 'brand', 'INVENTORY BATCH')">{{ text('brand', 'INVENTORY BATCH') }}</strong>
            <small :class="targetClass('warehouse')" :style="transformStyle('warehouse')" @pointerdown.stop.prevent="selectElement($event, 'warehouse', warehouseText)">{{ text('warehouse', warehouseText) }}</small>
        </header>
        <div class="batch-label-title">
            <h2 :class="targetClass('name')" :style="transformStyle('name')" @pointerdown.stop.prevent="selectElement($event, 'name', batch.name)">{{ text('name', batch.name) }}</h2>
            <span>BATCH</span>
        </div>
        <p class="mono" :class="targetClass('sku')" :style="transformStyle('sku')" @pointerdown.stop.prevent="selectElement($event, 'sku', displayCode)">{{ text('sku', displayCode) }}</p>
        <section class="batch-label-items" :class="targetClass('items')" :style="transformStyle('items')" @pointerdown.stop.prevent="selectElement($event, 'items', 'Batch products')">
            <div v-for="item in batchItems" :key="item.productId"><strong>{{ item.name }}</strong><span>{{ item.quantity }} {{ item.unit }}</span></div>
        </section>
        <footer class="batch-label-meta">
            <span :class="targetClass('supplier')" :style="transformStyle('supplier')" @pointerdown.stop.prevent="selectElement($event, 'supplier', supplierText)">{{ text('supplier', supplierText) }}</span>
            <span :class="targetClass('received')" :style="transformStyle('received')" @pointerdown.stop.prevent="selectElement($event, 'received', batch.receivedDate || '')">{{ text('received', batch.receivedDate || '') }}</span>
        </footer>
        <span v-for="key in customTextKeys" :key="key" class="label-custom-text" :class="targetClass(key)" :style="transformStyle(key)" @pointerdown.stop.prevent="selectElement($event, key, 'Text')">{{ text(key, 'Text') }}</span>
        <div class="batch-label-code">
            <span :class="targetClass('barcode')" :style="transformStyle('barcode')" @pointerdown.stop.prevent="selectElement($event, 'barcode')">
                <img v-if="barcodeDataUrl" :src="barcodeDataUrl" alt="Batch barcode" />
                <strong class="mono">{{ displayCode }}</strong>
            </span>
        </div>
    </article>
</template>

<script>
import { labelText, labelTransformStyle } from '@/utils/labelLayout'

export default {
    name: 'BatchLabel',
    props: {
        batch: { type: Object, required: true },
        products: { type: Array, default: () => [] },
        size: { type: String, default: 'medium' },
        orientation: { type: String, default: 'landscape' },
        warehouseName: { type: String, default: '' },
        barcodeDataUrl: { type: String, default: '' },
        edits: { type: Object, default: () => ({}) },
        editing: { type: Boolean, default: false },
        selectedKey: { type: String, default: '' },
    },
    emits: ['element-pointer'],
    computed: {
        displayCode() { return this.batch.code || this.batch.id },
        warehouseText() { return this.warehouseName || this.batch.warehouseName || 'WAREHOUSE' },
        supplierText() { return this.batch.supplierName || 'Supplier not recorded' },
        customTextKeys() { return this.edits.__customTextKeys || [] },
        batchItems() {
            return this.batch.items.map((item) => {
                const product = this.products.find((row) => row.id === item.productId) || {}
                return { ...item, name: product.name || 'Product', unit: product.unit || 'pcs' }
            })
        },
    },
    methods: {
        text(key, fallback) { return labelText(this.edits, key, fallback) },
        transformStyle(key) { return labelTransformStyle(this.edits, key) },
        targetClass(key) {
            return {
                'label-edit-target': this.editing,
                selected: this.editing && this.selectedKey === key,
            }
        },
        selectElement(event, key, fallback = '') {
            if (!this.editing) return
            this.$emit('element-pointer', event, key, fallback)
        },
    },
}
</script>

<style scoped src="@/assets/css/components/batch-label.css"></style>
