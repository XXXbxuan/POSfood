<template>
    <div class="page-stack receive-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">SUPPLIER DELIVERY</span>
                <h1>Receive Stock</h1>
                <p>Add quantity, batch details and a traceable stock record.</p>
            </div>
            <span class="workflow-steps"><b>1</b> Details <i></i><b>2</b> Confirm <i></i><b>3</b> Label</span>
        </section>

        <section v-if="!receipt" class="receive-layout">
            <form class="panel receive-form" @submit.prevent="confirmReceive">
                <header class="section-header">
                    <span><i class="fa-solid fa-truck-ramp-box"></i></span>
                    <div><h2>Delivery details</h2><p>Fields marked * are required.</p></div>
                </header>
                <div class="form-grid two-column">
                    <label><span>Supplier <b>*</b></span><input v-model.trim="form.supplier" type="text" required placeholder="Supplier name" /></label>
                    <label><span>Receiving Date <b>*</b></span><input v-model="form.receivingDate" type="date" required /></label>
                    <label><span>Invoice Number</span><input v-model.trim="form.invoiceNumber" class="mono" type="text" placeholder="INV-2026-001" /></label>
                    <label><span>Purchase Order</span><input v-model.trim="form.purchaseOrderNumber" class="mono" type="text" placeholder="PO-2026-001" /></label>
                </div>

                <div class="form-divider"></div>
                <header class="section-header compact-header">
                    <span><i class="fa-solid fa-box"></i></span>
                    <div><h2>Product & quantity</h2></div>
                </header>
                <div class="product-selector">
                    <label>
                        <span>Product <b>*</b></span>
                        <select v-model="form.productId" required @change="applyProductDefaults">
                            <option value="" disabled>Select product</option>
                            <option v-for="product in activeProducts" :key="product.id" :value="product.id">
                                {{ product.name }} — {{ product.sku }}
                            </option>
                        </select>
                    </label>
                    <button class="button secondary scan-inline" type="button" @click="scannerOpen = true">
                        <i class="fa-solid fa-qrcode"></i>Scan
                    </button>
                </div>
                <div v-if="selectedProduct" class="selected-product">
                    <span>{{ selectedProduct.name.slice(0,2).toUpperCase() }}</span>
                    <div><strong>{{ selectedProduct.name }}</strong><small class="mono">{{ selectedProduct.sku }} · {{ selectedProduct.location }}</small></div>
                    <div><small>Current stock</small><strong>{{ selectedProduct.currentStock }} {{ selectedProduct.unit }}</strong></div>
                </div>
                <div class="form-grid two-column">
                    <label><span>Quantity Received <b>*</b></span><input v-model.number="form.quantity" type="number" min="0.01" step="0.01" required inputmode="decimal" /></label>
                    <label><span>Unit Cost (RM)</span><input v-model.number="form.unitCost" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Batch Number <b>*</b></span><input v-model.trim="form.batch" class="mono" type="text" required /></label>
                    <label><span>Warehouse Location <b>*</b></span><input v-model.trim="form.location" type="text" required placeholder="Rack A-01" /></label>
                    <label><span>Manufacturing Date</span><input v-model="form.manufacturingDate" type="date" /></label>
                    <label><span>Expiry Date</span><input v-model="form.expiryDate" type="date" :required="selectedProduct?.expiryTracking" /></label>
                    <label class="full"><span>Remark</span><textarea v-model.trim="form.remark" rows="3" placeholder="Optional receiving note"></textarea></label>
                    <label class="toggle-label full">
                        <input v-model="form.printAfter" type="checkbox" />
                        <span><strong>Prepare labels after receiving</strong><small>One label for each received unit.</small></span>
                    </label>
                    <p v-if="error" class="form-error full"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
                </div>
                <footer class="receive-actions">
                    <p><i class="fa-solid fa-user-check"></i>Received by <strong>{{ store.state.activeAccount.name }}</strong></p>
                    <button class="button primary" type="submit"><i class="fa-solid fa-check"></i>Confirm Receive</button>
                </footer>
            </form>

            <aside class="panel receive-summary">
                <span class="eyebrow">RECEIVING SUMMARY</span>
                <h2>Stock calculation</h2>
                <div v-if="selectedProduct" class="summary-equation">
                    <div><small>Current</small><strong>{{ selectedProduct.currentStock }}</strong></div>
                    <i class="fa-solid fa-plus"></i>
                    <div><small>Received</small><strong>{{ Number(form.quantity) || 0 }}</strong></div>
                    <i class="fa-solid fa-equals"></i>
                    <div class="new-stock"><small>New Stock</small><strong>{{ projectedStock }}</strong></div>
                </div>
                <div v-else class="summary-placeholder"><i class="fa-solid fa-box-open"></i><p>Select a product to preview the new stock.</p></div>
                <dl>
                    <div><dt>Product</dt><dd>{{ selectedProduct?.name || '—' }}</dd></div>
                    <div><dt>Batch</dt><dd class="mono">{{ form.batch || '—' }}</dd></div>
                    <div><dt>Location</dt><dd>{{ form.location || '—' }}</dd></div>
                    <div><dt>Labels</dt><dd>{{ form.printAfter ? Number(form.quantity) || 0 : 0 }}</dd></div>
                </dl>
                <p class="audit-note"><i class="fa-solid fa-shield-halved"></i>This receiving will create an immutable Stock In record.</p>
            </aside>
        </section>

        <section v-else class="receive-complete panel">
            <span class="success-mark"><i class="fa-solid fa-check"></i></span>
            <span class="eyebrow">RECEIVING COMPLETED</span>
            <h1>{{ receipt.product.name }}</h1>
            <p>Stock and batch records are now updated.</p>
            <div class="completion-equation">
                <div><small>Before</small><strong>{{ receipt.before }}</strong></div>
                <i class="fa-solid fa-arrow-right"></i>
                <div><small>Received</small><strong>+{{ form.quantity }}</strong></div>
                <i class="fa-solid fa-arrow-right"></i>
                <div><small>New Stock</small><strong>{{ receipt.after }}</strong></div>
            </div>
            <div class="completion-details">
                <span><small>Movement</small><strong class="mono">{{ receipt.movement.id }}</strong></span>
                <span><small>Batch</small><strong class="mono">{{ receipt.batchId }}</strong></span>
                <span><small>Location</small><strong>{{ receipt.product.location }}</strong></span>
            </div>
            <div class="completion-actions">
                <button class="button secondary" type="button" @click="resetForm"><i class="fa-solid fa-plus"></i>Receive Another</button>
                <RouterLink class="button print" :to="{ path: '/inventory/labels', query: { product: receipt.product.sku, batch: receipt.batchId, quantity: form.quantity } }">
                    <i class="fa-solid fa-print"></i>Print {{ form.quantity }} Labels
                </RouterLink>
            </div>
        </section>

        <ScannerModal
            v-if="scannerOpen"
            @close="scannerOpen = false"
            @scanned="handleProductScan"
        />
    </div>
</template>

<script>
import ScannerModal from '@/components/ScannerModal.vue'
import { inventoryStore } from '@/services/inventoryStore'

function currentDate() {
    return new Date().toISOString().slice(0, 10)
}

function batchCode() {
    const date = currentDate().replaceAll('-', '').slice(2)
    return `B${date}01`
}

export default {
    name: 'ReceiveStockView',
    components: { ScannerModal },
    data() {
        return {
            store: inventoryStore,
            scannerOpen: false,
            error: '',
            receipt: null,
            form: this.newForm(),
        }
    },
    computed: {
        activeProducts() {
            return this.store.state.products.filter((product) => product.active)
        },
        selectedProduct() {
            return this.store.findProduct(this.form.productId)
        },
        projectedStock() {
            return (Number(this.selectedProduct?.currentStock) || 0) + (Number(this.form.quantity) || 0)
        },
    },
    methods: {
        newForm() {
            return {
                supplier: '',
                receivingDate: currentDate(),
                invoiceNumber: '',
                purchaseOrderNumber: '',
                productId: '',
                quantity: 50,
                unitCost: 0,
                batch: batchCode(),
                location: '',
                manufacturingDate: '',
                expiryDate: '',
                remark: '',
                printAfter: true,
            }
        },
        applyProductDefaults() {
            if (!this.selectedProduct) return
            this.form.supplier = this.selectedProduct.supplier
            this.form.location = this.selectedProduct.location
            this.form.unitCost = this.selectedProduct.costPrice
            this.form.batch = batchCode()
        },
        handleProductScan(value) {
            this.scannerOpen = false
            const product = this.store.findProduct(value)
            if (!product) {
                this.error = 'Product code was not recognised.'
                return
            }
            this.form.productId = product.id
            this.applyProductDefaults()
        },
        confirmReceive() {
            this.error = ''
            try {
                this.receipt = this.store.receiveStock(this.form)
                this.store.addToast('Stock received and history recorded.')
            } catch (error) {
                this.error = error.message
            }
        },
        resetForm() {
            this.form = this.newForm()
            this.receipt = null
            this.error = ''
        },
    },
}
</script>
