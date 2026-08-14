<template>
    <article class="inventory-label" :class="[`label-${size}`, `orientation-${orientation}`, { 'is-editing': editing, 'has-action-tag': showActionTag && actionText }]">
        <header>
            <span
                :class="targetClass('logo')"
                :style="transformStyle('logo')"
                @pointerdown.stop.prevent="selectElement($event, 'logo')"
            ><i class="fa-solid fa-boxes-stacked"></i></span>
            <strong
                :class="targetClass('brand')"
                :style="transformStyle('brand')"
                @pointerdown.stop.prevent="selectElement($event, 'brand', 'INVENTORY')"
            >{{ text('brand', 'INVENTORY') }}</strong>
            <small
                :class="targetClass('warehouse')"
                :style="transformStyle('warehouse')"
                @pointerdown.stop.prevent="selectElement($event, 'warehouse', warehouseText)"
            >{{ text('warehouse', warehouseText) }}</small>
        </header>

        <div class="label-product-line">
            <h2
                :class="targetClass('name')"
                :style="transformStyle('name')"
                @pointerdown.stop.prevent="selectElement($event, 'name', product.name)"
            >{{ text('name', product.name) }}</h2>
            <strong
                v-if="unitSequenceText"
                class="label-unit-sequence-top"
                :class="targetClass('sequence')"
                :style="transformStyle('sequence')"
                @pointerdown.stop.prevent="selectElement($event, 'sequence', unitSequenceText)"
            >{{ unitSequenceText }}</strong>
        </div>
        <p
            class="mono product-label-code"
            :class="targetClass('sku')"
            :style="transformStyle('sku')"
            @pointerdown.stop.prevent="selectElement($event, 'sku', product.sku)"
        >{{ text('sku', product.sku) }}</p>

        <div v-if="showActionTag && actionText" class="label-action-row">
            <span class="label-action-pill">{{ actionText }}</span>
        </div>

        <dl>
            <div
                v-if="batch"
                :class="fieldClass('batch')"
                :style="fieldStyle('batch')"
                @pointerdown.stop.prevent="selectElement($event, 'batch', batchText)"
            ><dt>{{ stockLayerLabel }}</dt><dd class="mono" :style="textStyle('batch')">{{ text('batch', batchText) }}</dd></div>
            <div
                v-if="!stockUnit || labelQuantity"
                :class="fieldClass('quantity')"
                :style="fieldStyle('quantity')"
                @pointerdown.stop.prevent="selectElement($event, 'quantity', quantityText)"
            ><dt>{{ stockUnit ? 'Unit' : 'Quantity' }}</dt><dd :style="textStyle('quantity')">{{ text('quantity', quantityText) }}</dd></div>
            <div
                :class="fieldClass('received')"
                :style="fieldStyle('received')"
                @pointerdown.stop.prevent="selectElement($event, 'received', receivedText)"
            ><dt>Received</dt><dd :style="textStyle('received')">{{ text('received', receivedText) }}</dd></div>
            <div
                v-if="showExpiry && batch?.expiryDate"
                :class="fieldClass('expiry')"
                :style="fieldStyle('expiry')"
                @pointerdown.stop.prevent="selectElement($event, 'expiry', expiryText)"
            ><dt>Expiry</dt><dd :style="textStyle('expiry')">{{ text('expiry', expiryText) }}</dd></div>
            <div
                :class="fieldClass('location')"
                :style="fieldStyle('location')"
                @pointerdown.stop.prevent="selectElement($event, 'location', locationText)"
            ><dt>Location</dt><dd :style="textStyle('location')">{{ text('location', locationText) }}</dd></div>
            <div
                v-if="showPrice"
                :class="fieldClass('price')"
                :style="fieldStyle('price')"
                @pointerdown.stop.prevent="selectElement($event, 'price', priceText)"
            ><dt>Price</dt><dd :style="textStyle('price')">{{ text('price', priceText) }}</dd></div>
            <div
                v-if="showDescription && descriptionText"
                :class="fieldClass('description')"
                :style="fieldStyle('description')"
                @pointerdown.stop.prevent="selectElement($event, 'description', descriptionText)"
            ><dt>Description</dt><dd :style="textStyle('description')">{{ descriptionText }}</dd></div>
        </dl>

        <span
            v-for="key in customTextKeys"
            :key="key"
            class="label-custom-text"
            :class="targetClass(key)"
            :style="transformStyle(key)"
            @pointerdown.stop.prevent="selectElement($event, key, 'Text')"
        >{{ text(key, 'Text') }}</span>

        <div class="label-code-row">
            <span
                v-if="barcodeDataUrl"
                class="label-barcode-target"
                :class="targetClass('barcode')"
                :style="transformStyle('barcode')"
                @pointerdown.stop.prevent="selectElement($event, 'barcode')"
            >
                <img :src="barcodeDataUrl" alt="Product barcode" />
                <strong class="label-barcode-number mono">{{ barcodeText }}</strong>
            </span>
        </div>
    </article>
</template>

<script>
import {
    labelFieldStyle,
    labelText,
    labelTextStyle,
    labelTransformStyle,
} from '@/utils/labelLayout'

export default {
    name: 'WarehouseLabel',
    props: {
        product: { type: Object, required: true },
        batch: { type: Object, default: null },
        size: { type: String, default: 'medium' },
        orientation: { type: String, default: 'landscape' },
        showExpiry: { type: Boolean, default: true },
        showPrice: { type: Boolean, default: false },
        showActionTag: { type: Boolean, default: false },
        showDescription: { type: Boolean, default: false },
        labelPurpose: { type: String, default: 'standard' },
        descriptionText: { type: String, default: '' },
        barcodeDataUrl: { type: String, default: '' },
        stockUnit: { type: Object, default: null },
        warehouseName: { type: String, default: '' },
        locationName: { type: String, default: '' },
        labelQuantity: { type: String, default: '' },
        sequenceIndex: { type: Number, default: 0 },
        sequenceTotal: { type: Number, default: 0 },
        edits: { type: Object, default: () => ({}) },
        editing: { type: Boolean, default: false },
        selectedKey: { type: String, default: '' },
    },
    emits: ['element-pointer'],
    computed: {
        customTextKeys() {
            return this.edits.__customTextKeys || []
        },
        warehouseText() {
            return (
                this.warehouseName ||
                this.stockUnit?.warehouseName ||
                'WAREHOUSE'
            ).toUpperCase()
        },
        quantityText() {
            if (this.labelQuantity) return this.labelQuantity
            if (this.stockUnit?.displayQuantity) return this.stockUnit.displayQuantity
            if (this.stockUnit) return this.unitSequenceText
            return `${this.batch?.quantity ?? this.product.currentStock} ${this.product.unit}`
        },
        batchText() {
            const sequence = Number(this.batch?.batchSequence)
            if (sequence > 0) return `B${String(sequence).padStart(2, '0')}`
            const raw = String(this.batch?.batchNumber || this.batch?.id || '')
            const simple = raw.match(/^B(\d{1,2})$/i)
            if (simple) return `B${String(Number(simple[1])).padStart(2, '0')}`
            return raw || '—'
        },
        stockLayerLabel() {
            return this.batch?.isBatch || this.batch?.batchGroupId ? 'Batch' : 'Lot'
        },
        barcodeText() {
            return (
                this.stockUnit?.code ||
                this.batch?.batchNumber ||
                this.batch?.id ||
                this.product.bar ||
                this.product.sku ||
                ''
            )
        },
        unitSequenceText() {
            const current = Number(
                this.sequenceIndex ||
                this.stockUnit?.batchOrdinal ||
                this.stockUnit?.ordinal ||
                this.stockUnit?.displayOrdinal,
            )
            const total = Number(
                this.sequenceTotal ||
                this.stockUnit?.receiptQuantity ||
                this.stockUnit?.displayTotal,
            )
            if (!current || !total) return ''
            return `${current}/${total}`
        },
        receivedText() {
            return this.formatDate(this.batch?.receivedDate)
        },
        expiryText() {
            return this.formatDate(this.batch?.expiryDate)
        },
        locationText() {
            return (
                this.locationName ||
                this.stockUnit?.location ||
                this.batch?.location ||
                this.product.location ||
                'Not assigned'
            )
        },
        priceText() {
            return `RM ${Number(this.product.sellingPrice || 0).toFixed(2)}`
        },
        actionText() {
            const labels = {
                standard: 'Standard label',
                move: 'Stock Movement label',
                remove: 'Remove label',
                return: 'Return label',
                damage: 'Damaged label',
                custom: 'Other label',
            }
            return labels[String(this.labelPurpose || 'standard').toLowerCase()] || 'Label'
        },
    },
    methods: {
        formatDate(value) {
            if (!value) return '—'
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(new Date(`${value}T00:00:00`))
        },
        text(key, fallback) {
            return labelText(this.edits, key, fallback)
        },
        transformStyle(key) {
            return labelTransformStyle(this.edits, key)
        },
        textStyle(key) {
            return labelTextStyle(this.edits, key)
        },
        fieldStyle(key) {
            return labelFieldStyle(this.edits, key)
        },
        targetClass(key) {
            return {
                'label-edit-target': this.editing,
                selected: this.editing && this.selectedKey === key,
            }
        },
        fieldClass(key) {
            return {
                'label-field-target': this.editing,
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

<style scoped src="@/assets/css/components/warehouse-label.css"></style>
