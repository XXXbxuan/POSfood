<template>
    <section class="embedded-operation" :class="direction">
        <header class="embedded-operation-header">
            <div>
                <span class="eyebrow">{{ direction === 'in' ? 'ADD INVENTORY' : 'DEDUCT INVENTORY' }}</span>
                <h2>{{ direction === 'in' ? 'Stock In' : 'Stock Out' }}</h2>
            </div>
            <button v-if="showClose" class="icon-button" type="button" aria-label="Close form" @click="$emit('close')">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </header>

        <div class="stock-equation" :class="direction">
            <div><span>Before</span><strong>{{ currentStock }}</strong></div>
            <i class="fa-solid" :class="direction === 'in' ? 'fa-plus' : 'fa-minus'"></i>
            <div><span>{{ direction === 'in' ? 'Add' : 'Remove' }}</span><strong>{{ numericQuantity }}</strong></div>
            <i class="fa-solid fa-equals"></i>
            <div><span>After</span><strong>{{ projectedStock }}</strong></div>
        </div>

        <form class="form-grid embedded-operation-form" @submit.prevent="submit">
            <label v-if="direction === 'out'">
                <span>Warehouse *</span>
                <ScrollableSelect v-model="form.sourceWarehouseId" required>
                    <option value="" disabled>Select warehouse</option>
                    <option v-for="warehouse in warehouseOptions" :key="warehouse.id" :value="warehouse.id">
                        {{ warehouse.name }}
                    </option>
                </ScrollableSelect>
            </label>
            <label v-if="direction === 'out'">
                <span>Location *</span>
                <ScrollableSelect v-model="form.sourceLocationId" required>
                    <option value="" disabled>Select location</option>
                    <option v-for="location in locationOptions" :key="location.id" :value="location.id">
                        {{ location.code }} — {{ location.quantity }} {{ product.unit }}
                    </option>
                </ScrollableSelect>
            </label>
            <label>
                <span>Quantity <b>*</b></span>
                <div class="quantity-stepper">
                    <button type="button" aria-label="Decrease quantity" @click="step(-1)"><i class="fa-solid fa-minus"></i></button>
                    <input v-model.number="form.quantity" type="number" min="0.01" step="0.01" inputmode="decimal" />
                    <button type="button" aria-label="Increase quantity" @click="step(1)"><i class="fa-solid fa-plus"></i></button>
                </div>
            </label>
            <label>
                <span>Reason <b>*</b></span>
                <ScrollableSelect v-model="form.reason" required>
                    <option v-for="reason in reasons" :key="reason">{{ reason }}</option>
                </ScrollableSelect>
            </label>
            <label>
                <span>Reference</span>
                <input v-model.trim="form.reference" type="text" :placeholder="direction === 'out' ? 'Optional private-use reference' : 'Reference (optional)'" />
            </label>
            <label>
                <span>Remark</span>
                <textarea v-model.trim="form.remark" rows="2" placeholder="Optional note"></textarea>
            </label>
            <label v-if="direction === 'out'" class="full">
                <span>Photo evidence</span>
                <input type="file" accept="image/*" @change="loadPhoto" />
                <small v-if="form.photo">Photo attached to this private stock-out record.</small>
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
        showClose: { type: Boolean, default: true },
    },
    emits: ['close', 'completed'],
    data() {
        return {
            form: {
                quantity: 1,
                reason: '',
                reference: '',
                remark: '',
                photo: '',
                sourceWarehouseId: '',
                sourceLocationId: '',
            },
            error: '',
        }
    },
    computed: {
        reasons() {
            return this.direction === 'in'
                ? ['Supplier Delivery']
                : ['Private Use', 'Kitchen Usage', 'Staff Usage', 'Damaged', 'Expired', 'Lost', 'Wastage', 'Stock Adjustment', 'Other']
        },
        currentStock() {
            return inventoryStore.productStock(this.product.id)
        },
        positions() {
            return inventoryStore
                .stockPositionsFor(this.product.id)
                .filter((position) => Number(position.availableQuantity) > 0)
        },
        warehouseOptions() {
            const ids = [...new Set(this.positions.map((position) => position.warehouseId))]
            return ids.map((id) => inventoryStore.findWarehouse(id)).filter(Boolean)
        },
        locationOptions() {
            if (!this.form.sourceWarehouseId) return []
            const rows = this.positions.filter(
                (position) => position.warehouseId === this.form.sourceWarehouseId,
            )
            return [...new Set(rows.map((position) => position.locationId))]
                .map((id) => {
                    const location = inventoryStore.findLocation(
                        this.form.sourceWarehouseId,
                        id,
                    )
                    return location
                        ? {
                              ...location,
                              quantity: rows
                                  .filter((position) => position.locationId === id)
                                  .reduce(
                                      (sum, position) =>
                                          sum + Number(position.availableQuantity),
                                      0,
                                  ),
                          }
                        : null
                })
                .filter(Boolean)
        },
        numericQuantity() {
            return Math.max(0, Number(this.form.quantity) || 0)
        },
        projectedStock() {
            const value =
                this.currentStock +
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
            this.selectDefaultSource()
        },
        'form.sourceWarehouseId'() {
            if (
                !this.locationOptions.some(
                    (location) => location.id === this.form.sourceLocationId,
                )
            ) {
                this.form.sourceLocationId = ''
            }
            if (this.locationOptions.length === 1) {
                this.form.sourceLocationId = this.locationOptions[0].id
            }
        },
    },
    mounted() {
        this.selectDefaultSource()
    },
    methods: {
        selectDefaultSource() {
            if (this.direction !== 'out') return
            if (this.warehouseOptions.length === 1) {
                this.form.sourceWarehouseId = this.warehouseOptions[0].id
            }
            this.$nextTick(() => {
                if (this.locationOptions.length === 1) {
                    this.form.sourceLocationId = this.locationOptions[0].id
                }
            })
        },
        step(amount) {
            this.form.quantity = Math.max(1, this.numericQuantity + amount)
        },
        loadPhoto(event) {
            const file = event.target.files?.[0]
            if (!file) return
            if (file.size > 1500000) {
                this.error = 'Choose a photo smaller than 1.5 MB.'
                event.target.value = ''
                return
            }
            const reader = new FileReader()
            reader.onload = () => { this.form.photo = String(reader.result || '') }
            reader.readAsDataURL(file)
        },
        submit() {
            this.error = ''
            if (this.direction === 'in') {
                this.$router.push({
                    name: 'receive',
                    query: { product: this.product.sku, choose: '1', source: 'products' },
                })
                this.$emit('close')
                return
            }
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

<style scoped src="@/assets/css/components/stock-operation-form.css"></style>
