<template>
    <section class="embedded-operation" :class="direction">
        <header class="embedded-operation-header">
            <div>
                <span class="eyebrow">{{ direction === 'in' ? 'ADD INVENTORY' : 'DEDUCT INVENTORY' }}</span>
                <h2>{{ direction === 'in' ? 'Stock In' : 'Stock Out' }}</h2>
                <p>{{ product.name }} &middot; {{ product.sku }}</p>
            </div>
            <button class="icon-button" type="button" aria-label="Close form" @click="$emit('close')">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </header>

        <div class="stock-equation" :class="direction">
            <div><span>Before</span><strong>{{ product.currentStock }}</strong></div>
            <i class="fa-solid" :class="direction === 'in' ? 'fa-plus' : 'fa-minus'"></i>
            <div><span>{{ direction === 'in' ? 'Add' : 'Remove' }}</span><strong>{{ numericQuantity }}</strong></div>
            <i class="fa-solid fa-equals"></i>
            <div><span>After</span><strong>{{ projectedStock }}</strong></div>
        </div>

        <form class="form-grid embedded-operation-form" @submit.prevent="submit">
            <label>
                <span>Quantity <b>*</b></span>
                <div class="quantity-stepper">
                    <button type="button" @click="step(-1)">&minus;</button>
                    <input v-model.number="form.quantity" type="number" min="0.01" step="0.01" inputmode="decimal" />
                    <button type="button" @click="step(1)">+</button>
                </div>
            </label>
            <label>
                <span>Reason <b>*</b></span>
                <select v-model="form.reason" required>
                    <option v-for="reason in reasons" :key="reason">{{ reason }}</option>
                </select>
            </label>
            <label>
                <span>Reference</span>
                <input v-model.trim="form.reference" type="text" placeholder="Invoice or transfer reference" />
            </label>
            <label>
                <span>Remark</span>
                <textarea v-model.trim="form.remark" rows="2" placeholder="Optional note"></textarea>
            </label>
            <p v-if="error" class="form-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
            <button class="button operation-submit" :class="direction === 'in' ? 'stock-in' : 'stock-out'" type="submit">
                <i class="fa-solid" :class="direction === 'in' ? 'fa-arrow-down' : 'fa-arrow-up'"></i>
                Confirm {{ direction === 'in' ? 'Stock In' : 'Stock Out' }}
            </button>
        </form>
    </section>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'StockOperationForm',
    props: {
        product: { type: Object, required: true },
        direction: { type: String, default: 'in' },
    },
    emits: ['close', 'completed'],
    data() {
        return {
            form: { quantity: 1, reason: '', reference: '', remark: '' },
            error: '',
        }
    },
    computed: {
        reasons() {
            return this.direction === 'in'
                ? ['Stock Top Up', 'Supplier Delivery', 'Customer Return', 'Stock Transfer In', 'Production Completed', 'Stock Adjustment', 'Other']
                : ['Sale', 'Kitchen Usage', 'Damaged', 'Expired', 'Wastage', 'Supplier Return', 'Transfer Out', 'Staff Usage', 'Stock Adjustment', 'Other']
        },
        numericQuantity() {
            return Math.max(0, Number(this.form.quantity) || 0)
        },
        projectedStock() {
            const value =
                Number(this.product.currentStock) +
                (this.direction === 'in' ? this.numericQuantity : -this.numericQuantity)
            return Math.max(0, Math.round(value * 100) / 100)
        },
    },
    watch: {
        direction: {
            immediate: true,
            handler() {
                this.form.reason = this.reasons[0]
                this.error = ''
            },
        },
        product() {
            this.form.quantity = 1
            this.error = ''
        },
    },
    methods: {
        step(amount) {
            this.form.quantity = Math.max(1, this.numericQuantity + amount)
        },
        submit() {
            this.error = ''
            try {
                const result = inventoryStore.adjustStock({
                    productId: this.product.id,
                    direction: this.direction,
                    ...this.form,
                })
                inventoryStore.addToast(
                    `${this.product.name}: ${result.before} → ${result.after} ${this.product.unit}`,
                )
                this.$emit('completed', result)
            } catch (error) {
                this.error = error.message
            }
        },
    },
}
</script>
