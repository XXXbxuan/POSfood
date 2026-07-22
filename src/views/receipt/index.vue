<template>
    <main class="receipt-page">
        <section class="receipt-wrap">
            <ThermalReceipt :receipt="receipt" />
            <div v-if="receipt.hasRemaining" class="remaining-note">
                <span>Remaining order</span
                ><strong>RM {{ money(receipt.remainingTotal) }}</strong>
            </div>
            <div
                class="receipt-actions"
                :class="{ continuing: receipt.hasRemaining }"
            >
                <button
                    v-if="receipt.hasRemaining"
                    type="button"
                    class="back continue"
                    @click="continueRemaining"
                >
                    <i class="fa-solid fa-arrow-left"></i
                    ><span>Back to dashboard</span></button
                ><button
                    v-else
                    type="button"
                    class="back"
                    @click="$router.push('/pos/start')"
                >
                    Done</button
                ><button type="button" class="print" @click="printReceipt">
                    <i class="fa-solid fa-print"></i><span>Print Receipt</span>
                </button>
            </div>
        </section>
    </main>
</template>
<script>
import ThermalReceipt from '@/components/receipt/ThermalReceipt.vue'
import { readList, readObject } from '@/services/pos/storage.js'

export default {
    name: 'POSReceipt',
    components: { ThermalReceipt },
    data() {
        return { receipt: { items: [], orderSetup: {} } }
    },
    mounted() {
        const sales = readList('posfood_sales')
        this.receipt =
            sales.find((sale) => sale.id === this.$route.params.id) ||
            readObject('posfood_last_receipt') ||
            this.receipt
        if (!this.receipt.id) return this.$router.replace('/pos/transactions')
        if (this.$route.query.print === '1')
            this.$nextTick(() => setTimeout(() => window.print(), 120))
    },
    methods: {
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        continueRemaining() {
            const id = this.receipt.remainingOrderId
            this.$router.push(
                id
                    ? { path: '/pos/start', query: { reopen: id } }
                    : '/pos/start',
            )
        },
        printReceipt() {
            window.print()
        },
    },
}
</script>
