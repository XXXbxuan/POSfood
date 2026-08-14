<template>
    <Teleport to="body">
        <div class="supplier-receipt-backdrop" @mousedown.self="$emit('close')">
            <section class="supplier-receipt-modal" role="dialog" aria-modal="true" aria-label="Inventory receipt">
                <header class="supplier-receipt-modal-header">
                    <div><span>SUPPLIER RECEIPT</span><h2>{{ record.invoiceNumber || record.receiptNumber || record.id }}</h2></div>
                    <div class="supplier-receipt-modal-controls">
                        <div v-if="recordTotal > 1" class="supplier-receipt-record-nav" aria-label="Invoice navigation">
                            <button type="button" aria-label="Previous invoice" @click="$emit('previous')"><i class="fa-solid fa-chevron-left"></i></button>
                            <strong><i class="fa-solid fa-file-invoice"></i>{{ recordIndex + 1 }} / {{ recordTotal }}</strong>
                            <button type="button" aria-label="Next invoice" @click="$emit('next')"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                        <button type="button" aria-label="Close receipt" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </header>
                <div class="supplier-receipt-scroll">
                    <SupplierReceiptDocument :record="record" :supplier="supplier" />
                </div>
                <footer class="supplier-receipt-actions">
                    <button type="button" class="button secondary" @click="$emit('close')">Close</button>
                    <button type="button" class="button primary" @click="printReceipt"><i class="fa-solid fa-print"></i>Print</button>
                </footer>
            </section>
        </div>
    </Teleport>
</template>

<script>
import SupplierReceiptDocument from '@/components/supplier/SupplierReceiptDocument.vue'

export default {
    name: 'SupplierReceiptModal',
    components: { SupplierReceiptDocument },
    props: {
        record: { type: Object, required: true },
        supplier: { type: Object, default: null },
        recordIndex: { type: Number, default: 0 },
        recordTotal: { type: Number, default: 1 },
    },
    emits: ['close', 'print', 'previous', 'next'],
    beforeUnmount() {
        this.finishReceiptPrint()
    },
    methods: {
        printReceipt() {
            this.$emit('print', this.record)
            document.body.classList.add('printing-supplier-receipt')
            window.removeEventListener('afterprint', this.finishReceiptPrint)
            window.addEventListener('afterprint', this.finishReceiptPrint, { once: true })
            this.$nextTick(() => {
                try {
                    window.print()
                } catch (error) {
                    this.finishReceiptPrint()
                    throw error
                }
            })
        },
        finishReceiptPrint() {
            window.removeEventListener('afterprint', this.finishReceiptPrint)
            document.body.classList.remove('printing-supplier-receipt')
        },
    },
}
</script>

<style src="@/assets/css/components/supplier-receipt.css"></style>
