<template>
    <article class="sir-document">
        <header class="sir-document__head">
            <div class="sir-document__brand">
                <span><i class="fa-solid fa-warehouse"></i></span>
                <div><strong>INVENTORY WORKSPACE</strong><small>{{ request.destinationWarehouseName || 'Warehouse' }}</small></div>
            </div>
            <div class="sir-document__title">
                <span>{{ documentCategory }}</span>
                <h2>{{ confirmation ? 'STOCK IN CONFIRMATION' : 'STOCK IN REQUEST' }}</h2>
            </div>
        </header>

        <section class="sir-document__meta">
            <div class="sir-document__route">
                <article><small>{{ isSupplierRequest ? 'SUPPLIER' : 'FROM' }}</small><strong>{{ sourceRouteLabel }}</strong><p>{{ request.sourceAddress || 'Address not recorded' }}</p></article>
                <i class="fa-solid fa-arrow-right"></i>
                <article><small>TO</small><strong>{{ destinationRouteLabel }}</strong><p>{{ request.destinationAddress || 'Address not recorded' }}</p></article>
            </div>
            <dl>
                <div><dt>Request #</dt><dd class="mono">{{ request.requestNumber || request.id }}</dd></div>
                <div v-if="confirmation"><dt>Confirmation #</dt><dd class="mono">{{ request.confirmationId || '—' }}</dd></div>
                <div><dt>{{ confirmation ? 'Confirmed' : 'Requested' }}</dt><dd>{{ formatDate(confirmation ? request.confirmedAt : request.requestedAt) }}</dd></div>
                <div><dt>Status</dt><dd>{{ confirmation ? 'Confirmed' : statusLabel }}</dd></div>
            </dl>
        </section>

        <table class="sir-document__table" :class="{ 'has-batch-column': showBatchColumn }">
            <thead><tr><th>Qty</th><th>Unit</th><th>Description</th><th>Code</th><th>Source location</th><th v-if="showBatchColumn">Batch / lot</th></tr></thead>
            <tbody>
                <tr v-for="(line, index) in lines" :key="line.productId || index">
                    <td>{{ formatQuantity(line.quantity) }}</td>
                    <td>{{ line.unit || 'pcs' }}</td>
                    <td>{{ line.productName || 'Product' }}</td>
                    <td class="mono">{{ line.sku || '—' }}</td>
                    <td>{{ line.sourceLocationName || sourceLocationFallback }}</td>
                    <td v-if="showBatchColumn" class="mono">{{ line.batchId || line.lotId || '—' }}</td>
                </tr>
            </tbody>
        </table>

        <section v-if="request.reference || request.driverName || request.remark || cancellationRemark || (confirmation && confirmationRemark)" class="sir-document__summary">
            <dl>
                <div v-if="request.reference"><dt>Reference</dt><dd class="mono">{{ request.reference }}</dd></div>
                <div v-if="request.driverName"><dt>Driver</dt><dd>{{ request.driverName }}</dd></div>
                <div v-if="request.remark"><dt>Remark</dt><dd>{{ request.remark }}</dd></div>
                <div v-if="request.status === 'cancelled' && cancellationRemark"><dt>Cancellation remark</dt><dd>{{ cancellationRemark }}</dd></div>
                <div v-else-if="confirmation && confirmationRemark"><dt>Confirmation remark</dt><dd>{{ confirmationRemark }}</dd></div>
            </dl>
        </section>

        <footer class="sir-document__signatures">
            <div><span>{{ request.requestedByName || 'Warehouse Staff' }}</span><strong>Requested by</strong></div>
            <div><span>{{ confirmation ? (request.confirmedByName || 'Warehouse Staff') : '' }}</span><strong>Received by</strong></div>
            <div><span>{{ formatDate(confirmation ? request.confirmedAt : request.requestedAt) }}</span><strong>Date</strong></div>
        </footer>
    </article>
</template>

<script>
export default {
    name: 'StockInRequestDocument',
    props: {
        request: { type: Object, required: true },
        confirmation: { type: Boolean, default: false },
    },
    computed: {
        lines() { return this.request.confirmedLines?.length ? this.request.confirmedLines : (this.request.lines || []) },
        showBatchColumn() {
            const items = Array.isArray(this.request.items) ? this.request.items : []
            return items.some((item) => item.kind === 'batch') || this.lines.some((line) => Boolean(line.batchId))
        },
        totalQuantity() { return this.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0) },
        confirmationRemark() {
            return String(this.request.confirmationRemark || this.request.actualPayload?.confirmationRemark || this.request.receipt?.confirmationRemark || this.request.receipt?.receipt?.confirmationRemark || '')
        },
        cancellationRemark() { return String(this.request.cancellationRemark || this.request.cancelRemark || '') },
        statusLabel() { return this.request.status === 'cancelled' ? 'Cancelled' : 'Waiting Confirmation' },
        isSupplierRequest() { return this.request.requestType === 'supplier_stock_in' || Boolean(this.request.supplierId || this.request.supplierName) },
        documentCategory() { return this.isSupplierRequest ? 'SUPPLIER STOCK IN' : 'STOCK MOVEMENT' },
        sourceLocationNames() {
            const explicit = Array.isArray(this.request.sourceLocationNames) ? this.request.sourceLocationNames.filter(Boolean) : []
            if (explicit.length) return [...new Set(explicit)]
            return [...new Set(this.lines.map((line) => line.sourceLocationName).filter(Boolean))]
        },
        sourceLocationFallback() { return this.sourceLocationNames.length === 1 ? this.sourceLocationNames[0] : '—' },
        sourceRouteLabel() {
            if (this.isSupplierRequest) return this.request.supplierName || this.request.sourceLabel || 'Supplier'
            const names = this.sourceLocationNames
            const suffix = names.length ? ` · ${names.slice(0, 2).join(' · ')}${names.length > 2 ? ' · …' : ''}` : ''
            return `${this.request.sourceWarehouseName || this.request.sourceLabel || 'Warehouse'}${suffix}`
        },
        destinationRouteLabel() {
            const location = this.request.destinationLocationName ? ` · ${this.request.destinationLocationName}` : ''
            return `${this.request.destinationWarehouseName || 'Warehouse'}${location}`
        },
        stockTypeLabel() {
            const items = Array.isArray(this.request.items) ? this.request.items : []
            if (!items.length) return this.request.sourceType === 'batch' ? 'Registered Batch' : 'Product'
            const products = items.filter((item) => item.kind === 'product').length
            const batches = items.filter((item) => item.kind === 'batch').length
            return [products ? `${products} product line${products === 1 ? '' : 's'}` : '', batches ? `${batches} batch line${batches === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')
        },
    },
    methods: {
        formatQuantity(value) { return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0) },
        formatDate(value) {
            if (!value) return '—'
            const candidate = String(value).length === 10 ? `${value}T00:00:00` : value
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(candidate))
        },
    },
}
</script>
