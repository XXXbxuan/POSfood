<template>
    <article class="supplier-receipt-document">
        <header class="supplier-receipt-masthead">
            <div class="supplier-receipt-company">
                <div class="supplier-receipt-logo">
                    <img v-if="record.companyLogo" :src="record.companyLogo" alt="Company logo" />
                    <i v-else class="fa-solid fa-warehouse"></i>
                </div>
                <div>
                    <strong>{{ record.companyName || 'Inventory Workspace' }}</strong>
                    <span>{{ record.companyDetails || record.warehouseName || 'Main Warehouse' }}</span>
                </div>
            </div>
            <div class="supplier-receipt-title">
                <span>INVENTORY</span>
                <h2>RECEIPT</h2>
            </div>
        </header>

        <section class="supplier-receipt-parties">
            <div>
                <span>RECEIVED FROM</span>
                <strong>{{ supplier?.name || record.supplierName || 'Supplier' }}</strong>
                <p v-if="supplier?.contactName">{{ supplier.contactName }}</p>
                <p v-if="supplier?.phone">{{ supplier.phone }}</p>
                <p v-if="supplier?.email">{{ supplier.email }}</p>
                <p v-if="supplierAddress" class="supplier-receipt-address"><i class="fa-solid fa-location-dot"></i>{{ supplierAddress }}</p>
            </div>
            <dl>
                <div><dt>Receipt #</dt><dd class="mono">{{ receiptNumber }}</dd></div>
                <div v-if="record.invoiceNumber"><dt>Supplier invoice</dt><dd class="mono">{{ record.invoiceNumber }}</dd></div>
                <div v-if="record.purchaseOrderNumber"><dt>Purchase order</dt><dd class="mono">{{ record.purchaseOrderNumber }}</dd></div>
                <div><dt>Receipt date</dt><dd>{{ formatDate(record.receivedDate || record.createdAt) }}</dd></div>
            </dl>
        </section>

        <table class="supplier-receipt-table">
            <thead><tr><th>Qty</th><th>Unit</th><th>Description</th><th>Product code</th><th>Batch / lot</th></tr></thead>
            <tbody>
                <tr v-for="(line, index) in lines" :key="line.id || `${line.productId}-${index}`">
                    <td>{{ formatQuantity(line.quantity) }}</td>
                    <td>{{ line.unit || 'pcs' }}</td>
                    <td>{{ line.productName || productName(line.productId) }}</td>
                    <td class="mono">{{ line.sku || productSku(line.productId) }}</td>
                    <td class="mono">{{ line.batchNumber || record.batchNumber || '—' }}</td>
                </tr>
            </tbody>
        </table>

        <section class="supplier-receipt-summary">
            <dl>
                <div><dt>Supplier</dt><dd>{{ supplier?.name || record.supplierName || '—' }}</dd></div>
                <div><dt>From</dt><dd>{{ supplierAddress || supplier?.name || record.supplierName || '—' }}</dd></div>
                <div><dt>To warehouse</dt><dd>{{ record.warehouseName || record.companyDetails || 'Main Warehouse' }}</dd></div>
                <div><dt>Location</dt><dd>{{ record.location || '—' }}</dd></div>
                <div><dt>Total quantity</dt><dd>{{ formatQuantity(totalQuantity) }}</dd></div>
                <div v-if="record.confirmationRemark"><dt>Confirmation remark</dt><dd class="supplier-receipt-confirmation-remark">{{ record.confirmationRemark }}</dd></div>
            </dl>
        </section>

        <footer class="supplier-receipt-signatures">
            <div><span class="signature-line">{{ record.receivedByName || 'Warehouse Staff' }}</span><strong>Received by</strong></div>
            <div><span class="signature-line"></span><strong>Supplier signature</strong></div>
            <div><span class="signature-line">{{ formatDate(record.receivedDate || record.createdAt) }}</span><strong>Date</strong></div>
        </footer>
    </article>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'SupplierReceiptDocument',
    props: {
        record: { type: Object, required: true },
        supplier: { type: Object, default: null },
    },
    data() { return { store: inventoryStore } },
    computed: {
        lines() { return Array.isArray(this.record.lines) ? this.record.lines : [] },
        supplierAddress() { return String(this.record.supplierAddress || this.supplier?.address || '').trim() },
        totalQuantity() { return this.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0) },
        receiptNumber() {
            const ids = this.record.receiptIds
            if (Array.isArray(ids) && ids.length > 1) return `${ids[0]} +${ids.length - 1}`
            return this.record.receiptNumber || this.record.id || '—'
        },
    },
    methods: {
        formatQuantity(value) { return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0) },
        formatDate(value) {
            if (!value) return '—'
            const candidate = String(value).length === 10 ? `${value}T00:00:00` : value
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(candidate))
        },
        productName(productId) { return this.store.findProduct(productId)?.name || 'Product' },
        productSku(productId) { return this.store.findProduct(productId)?.sku || '—' },
    },
}
</script>
