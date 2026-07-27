<template>
    <div class="modal-backdrop" @click.self="$emit('close')">
        <section class="form-modal operation-modal">
            <header class="modal-header">
                <div>
                    <span class="eyebrow">{{ direction === 'in' ? 'ADD INVENTORY' : 'DEDUCT INVENTORY' }}</span>
                    <h2>{{ direction === 'in' ? 'Stock In' : 'Stock Out' }}</h2>
                    <p>{{ product.name }} · {{ product.sku }}</p>
                </div>
                <button class="icon-button" type="button" aria-label="Close" @click="$emit('close')">
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

            <form class="form-grid" @submit.prevent="submit">
                <label>
                    <span>Quantity <b>*</b></span>
                    <div class="quantity-stepper">
                        <button type="button" @click="step(-1)">−</button>
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
                <label class="full">
                    <span>Reference</span>
                    <input v-model.trim="form.reference" type="text" placeholder="Invoice, transfer or kitchen reference" />
                </label>
                <label class="full">
                    <span>Remark</span>
                    <textarea v-model.trim="form.remark" rows="3" placeholder="Optional note"></textarea>
                </label>
                <p v-if="error" class="form-error full"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
                <footer class="form-actions full">
                    <button class="button secondary" type="button" @click="$emit('close')">Cancel</button>
                    <button class="button" :class="direction === 'in' ? 'stock-in' : 'stock-out'" type="submit">
                        <i class="fa-solid" :class="direction === 'in' ? 'fa-arrow-down' : 'fa-arrow-up'"></i>
                        Confirm {{ direction === 'in' ? 'Stock In' : 'Stock Out' }}
                    </button>
                </footer>
            </form>
        </section>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'StockOperationModal',
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
                ? [
                      'Stock Top Up',
                      'Supplier Delivery',
                      'Customer Return',
                      'Stock Transfer In',
                      'Production Completed',
                      'Stock Adjustment',
                      'Other',
                  ]
                : [
                      'Sale',
                      'Kitchen Usage',
                      'Damaged',
                      'Expired',
                      'Wastage',
                      'Supplier Return',
                      'Transfer Out',
                      'Staff Usage',
                      'Stock Adjustment',
                      'Other',
                  ]
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
    created() {
        this.form.reason = this.reasons[0]
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
