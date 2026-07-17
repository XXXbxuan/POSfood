<template>
    <article class="thermal-receipt" :class="{ compact }">
        <header>
            <h1>RESTRO POS</h1>
            <p>Malaysia Restaurant Demo</p>
            <p>Company No: 202601234567</p>
            <p>Tel: +60 3-1234 5678</p>
        </header>
        <div class="receipt-divider">********************************</div>
        <section class="receipt-info">
            <div>
                <span>Receipt</span><strong>{{ receipt.orderNumber }}</strong>
            </div>
            <div>
                <span>Date</span><strong>{{ dateLabel }}</strong>
            </div>
            <div>
                <span>Order</span><strong>{{ orderLabel }}</strong>
            </div>
            <div>
                <span>Staff ID</span
                ><strong>{{ receipt.employeeId || 'EMP001' }}</strong>
            </div>
        </section>
        <div class="receipt-divider">--------------------------------</div>
        <div class="items-heading">
            <span>ITEM</span><span>AMOUNT (RM)</span>
        </div>
        <section class="receipt-items">
            <article
                v-for="item in receipt.items || []"
                :key="item.key || item.name"
            >
                <div>
                    <strong>{{ item.name }}</strong
                    ><small>{{ optionText(item) }}</small
                    ><span
                        >{{ item.qty }} × RM
                        {{
                            money(item.unitPrice || item.total / item.qty)
                        }}</span
                    >
                </div>
                <b>{{ money(item.total) }}</b>
            </article>
        </section>
        <div class="receipt-divider">--------------------------------</div>
        <section class="receipt-totals">
            <div>
                <span>Subtotal</span
                ><strong>RM {{ money(receipt.subtotal) }}</strong>
            </div>
            <div>
                <span>Sales Tax</span
                ><strong>RM {{ money(receipt.tax) }}</strong>
            </div>
            <div class="grand">
                <span>TOTAL</span><strong>RM {{ money(receipt.total) }}</strong>
            </div>
            <div>
                <span>Payment</span
                ><strong>{{ receipt.paymentMethod || 'Pay later' }}</strong>
            </div>
            <div v-if="receipt.paymentMethod === 'Cash'">
                <span>Cash</span
                ><strong>RM {{ money(receipt.cashReceived) }}</strong>
            </div>
            <div v-if="receipt.paymentMethod === 'Cash'">
                <span>Change</span
                ><strong>RM {{ money(receipt.change) }}</strong>
            </div>
            <div v-if="receipt.reference">
                <span>Reference</span><strong>{{ receipt.reference }}</strong>
            </div>
        </section>
        <div class="receipt-divider">********************************</div>
        <footer>
            <strong>THANK YOU</strong>
            <p>Please keep this receipt for your reference.</p>
            <p>All prices are in Malaysian Ringgit (RM).</p>
        </footer>
    </article>
</template>

<script>
export default {
    name: 'ThermalReceipt',
    props: {
        receipt: { type: Object, required: true },
        compact: { type: Boolean, default: false },
    },
    computed: {
        dateLabel() {
            const value =
                this.receipt.paidAt ||
                this.receipt.heldAt ||
                this.receipt.createdAt
            return value
                ? new Intl.DateTimeFormat('en-MY', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                      hour12: true,
                  }).format(new Date(value))
                : '-'
        },
        orderLabel() {
            const setup = this.receipt.orderSetup || {}
            return setup.orderType === 'Dine In'
                ? `Dine In · ${setup.tableNumber || '-'}`
                : setup.orderType || this.receipt.orderType || 'Takeaway'
        },
    },
    methods: {
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        optionText(item) {
            return (item.optionLines || [item.size || 'Regular'])
                .filter(Boolean)
                .join(' · ')
        },
    },
}
</script>
