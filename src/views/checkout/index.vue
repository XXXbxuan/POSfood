<template>
    <main class="checkout-popup-page">
        <POSDashboard class="checkout-background" aria-hidden="true" />

        <div class="checkout-payment-backdrop" @click.self="closeCheckout">
            <section
                class="payment-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-title"
            >
                <header class="payment-drawer-header">
                    <div>
                        <span>CHECKOUT</span>
                        <h2 id="payment-title">Choose Payment</h2>
                        <p>
                            {{ checkout.orderNumber }} · RM
                            {{ money(paymentTotal) }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="payment-close"
                        aria-label="Close payment"
                        @click="closeCheckout"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <nav class="method-tabs" aria-label="Payment method">
                    <button
                        v-for="method in methods"
                        :key="method.name"
                        type="button"
                        :class="{ active: paymentMethod === method.name }"
                        @click="selectMethod(method.name)"
                    >
                        <i class="fa-solid" :class="method.icon"></i
                        ><span>{{ method.name }}</span>
                    </button>
                </nav>

                <div class="drawer-method-form">
                    <template v-if="paymentMethod === 'Cash'">
                        <div class="cash-entry-row">
                            <label
                                >Cash received<input
                                    v-model.number="cashReceived"
                                    type="number"
                                    min="0"
                                    step="0.10"
                                    inputmode="decimal"
                                    pattern="[0-9]*"
                                    placeholder="Enter amount"
                                    @keydown="restrictCashKey"
                            /></label>
                            <div class="change-card">
                                <span>Change</span
                                ><strong>RM {{ money(change) }}</strong>
                            </div>
                        </div>
                        <div class="quick-cash-grid">
                            <button
                                v-for="amount in quickCash"
                                :key="amount"
                                type="button"
                                :class="{
                                    active: Number(cashReceived) === amount,
                                }"
                                @click="chooseCash(amount)"
                            >
                                <small>RM</small><strong>{{ amount }}</strong>
                            </button>
                        </div>
                        <button
                            type="button"
                            class="exact-cash-button"
                            :class="{
                                active: Number(cashReceived) === paymentTotal,
                            }"
                            @click="chooseCash(paymentTotal)"
                        >
                            <span>Exact amount</span
                            ><strong>RM {{ money(paymentTotal) }}</strong>
                        </button>
                        <p class="cash-help">
                            Choose a common note or enter a specific amount
                            above.
                        </p>
                    </template>

                    <template v-else-if="paymentMethod === 'Bank'">
                        <div class="bank-fields">
                            <label
                                >Bank<select v-model="bankName">
                                    <option>Maybank</option>
                                    <option>CIMB Bank</option>
                                    <option>Public Bank</option>
                                    <option>RHB Bank</option>
                                </select></label
                            ><label
                                >Transaction reference<input
                                    v-model.trim="bankReference"
                                    type="text"
                                    placeholder="Enter bank reference"
                            /></label>
                        </div>
                    </template>

                    <template v-else>
                        <div
                            class="wallet-provider-grid"
                            role="radiogroup"
                            aria-label="E-Wallet provider"
                        >
                            <button
                                v-for="provider in walletProviders"
                                :key="provider.name"
                                type="button"
                                role="radio"
                                :aria-label="provider.name"
                                :aria-checked="walletProvider === provider.name"
                                :class="{
                                    active: walletProvider === provider.name,
                                }"
                                @click="walletProvider = provider.name"
                            >
                                <img
                                    class="wallet-provider-logo"
                                    :class="`wallet-logo-${provider.key}`"
                                    :src="provider.image"
                                    :alt="provider.name"
                                /><span class="wallet-tick"
                                    ><i class="fa-solid fa-check"></i
                                ></span>
                            </button>
                        </div>
                        <button
                            type="button"
                            class="merchant-qr"
                            @click="showQrZoom = true"
                        >
                            <div class="qr-frame">
                                <img
                                    class="tng-qr"
                                    :src="mockQr"
                                    :alt="`${walletProvider} demo payment QR`"
                                /><span>DEMO</span>
                            </div>
                            <strong
                                >Scan to pay RM
                                {{ money(paymentTotal) }}</strong
                            ><small
                                >{{ walletProvider }} merchant QR · Tap to
                                enlarge</small
                            >
                        </button>
                    </template>
                </div>

                <p v-if="cashShortfall" class="error-message">
                    Cash received must be at least RM {{ money(paymentTotal) }}.
                </p>
                <p v-else-if="error" class="error-message">{{ error }}</p>

                <footer class="drawer-payment-action">
                    <button
                        type="button"
                        class="complete-payment"
                        :disabled="!canRequestPayment"
                        @click="requestPayment"
                    >
                        <i class="fa-solid fa-check"></i><span>Pay</span
                        ><strong>RM {{ money(paymentTotal) }}</strong>
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="showConfirm"
            class="confirm-backdrop"
            @click.self="showConfirm = false"
        >
            <section class="confirm-payment">
                <div><i class="fa-solid fa-shield-check"></i></div>
                <h2>Confirm payment?</h2>
                <p>
                    Collect <strong>RM {{ money(paymentTotal) }}</strong> by
                    {{ paymentMethod
                    }}<template v-if="paymentMethod === 'Cash'">
                        and return
                        <strong>RM {{ money(change) }}</strong></template
                    >.
                </p>
                <small v-if="isSplitPayment"
                    >Only the selected items will be paid. The remaining order
                    stays open.</small
                >
                <footer>
                    <button type="button" @click="showConfirm = false">
                        Back</button
                    ><button
                        type="button"
                        class="confirm-pay"
                        @click="completePayment"
                    >
                        Confirm & Pay
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="showSuccess"
            class="confirm-backdrop payment-success-backdrop"
        >
            <section class="payment-success-card">
                <div><i class="fa-solid fa-check"></i></div>
                <h2>Payment complete</h2>
                <p v-if="completedReceipt?.hasRemaining">
                    This payment is saved. The remaining order will reopen for
                    the next payment.
                </p>
                <p v-else>The table is now available for the next customer.</p>
                <strong>RM {{ money(completedReceipt?.total) }}</strong>
                <footer>
                    <button type="button" @click="finishPayment(false)">
                        Close</button
                    ><button
                        type="button"
                        class="show-receipt"
                        @click="finishPayment(true)"
                    >
                        <i class="fa-solid fa-receipt"></i>Show receipt
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="showReceiptModal"
            class="receipt-popup-backdrop"
            @click.self="closeReceiptAndFinish"
        >
            <section
                class="receipt-popup"
                role="dialog"
                aria-modal="true"
                aria-label="Payment receipt"
            >
                <header>
                    <div>
                        <span>RECEIPT</span>
                        <h2>{{ completedReceipt?.orderNumber }}</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close receipt"
                        @click="closeReceiptAndFinish"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="receipt-popup-content">
                    <ThermalReceipt :receipt="completedReceipt" />
                </div>
                <footer>
                    <button
                        type="button"
                        class="receipt-popup-close"
                        @click="closeReceiptAndFinish"
                    >
                        Close</button
                    ><button
                        type="button"
                        class="receipt-popup-print"
                        @click="printReceipt"
                    >
                        <i class="fa-solid fa-print"></i>Print receipt
                    </button>
                </footer>
            </section>
        </div>

        <QrZoomModal
            v-if="showQrZoom"
            :amount="paymentTotal"
            :provider="walletProvider"
            :qr="mockQr"
            @close="showQrZoom = false"
        />
    </main>
</template>

<script>
import mockQr from '@/assets/img/icons/mock-tng-qr.svg'
import tngLogo from '@/assets/img/payment/tng.jpg'
import alipayLogo from '@/assets/img/payment/alipay.png'
import grabLogo from '@/assets/img/payment/grab.jpg'
import boostLogo from '@/assets/img/payment/boost.png'
import POSDashboard from '@/views/start/index.vue'
import ThermalReceipt from '@/components/receipt/ThermalReceipt.vue'
import QrZoomModal from '@/components/checkout/QrZoomModal.vue'
import { readList as readStoredList } from '@/services/pos/storage.js'
import { normalizeCheckout } from '@/utils/order.js'
export default {
    name: 'POSCheckout',
    components: { POSDashboard, ThermalReceipt, QrZoomModal },
    data() {
        return {
            checkout: {
                items: [],
                orderGroups: [],
                orderSetup: {},
                subtotal: 0,
                tax: 0,
                total: 0,
            },
            mockQr,
            paymentMethod: 'Cash',
            methods: [
                { name: 'Cash', icon: 'fa-money-bill-wave' },
                { name: 'Bank', icon: 'fa-building-columns' },
                { name: 'E-Wallet', icon: 'fa-mobile-screen-button' },
            ],
            cashReceived: 0,
            quickCash: [10, 20, 50, 100],
            bankName: 'Maybank',
            bankReference: '',
            walletProvider: "Touch 'n Go",
            walletProviders: [
                { key: 'tng', name: "Touch 'n Go", image: tngLogo },
                { key: 'alipay', name: 'Alipay+', image: alipayLogo },
                { key: 'grab', name: 'GrabPay', image: grabLogo },
                { key: 'boost', name: 'Boost', image: boostLogo },
            ],
            showQrZoom: false,
            showConfirm: false,
            showSuccess: false,
            showReceiptModal: false,
            completedReceipt: null,
            error: '',
        }
    },
    computed: {
        displayGroups() {
            return this.checkout.orderGroups?.length
                ? this.checkout.orderGroups
                : [{ label: 'Order', items: this.checkout.items || [] }]
        },
        paymentSubtotal() {
            return Number(this.checkout.subtotal || 0)
        },
        paymentTax() {
            return Number(this.checkout.tax || 0)
        },
        paymentTotal() {
            return Number(this.checkout.total || 0)
        },
        change() {
            return Math.max(
                0,
                Number(this.cashReceived || 0) - this.paymentTotal,
            )
        },
        cashShortfall() {
            return (
                this.paymentMethod === 'Cash' &&
                this.paymentTotal > 0 &&
                Number(this.cashReceived || 0) < this.paymentTotal
            )
        },
        canRequestPayment() {
            return this.paymentTotal > 0 && !this.cashShortfall
        },
        isSplitPayment() {
            return Boolean(
                this.checkout.partialPayment ||
                    this.checkout.splitPayment ||
                    this.checkout.splitSessionId,
            )
        },
    },
    mounted() {
        try {
            const checkout = JSON.parse(
                localStorage.getItem('posfood_checkout'),
            )
            if (!checkout?.items?.length)
                return this.$router.replace('/pos/start')
            this.checkout = normalizeCheckout(checkout)
        } catch (error) {
            this.$router.replace('/pos/start')
        }
    },
    methods: {
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        readList(key) {
            return readStoredList(key)
        },
        selectMethod(method) {
            this.paymentMethod = method
            this.error = ''
            this.showConfirm = false
        },
        chooseCash(amount) {
            this.cashReceived = Number(amount)
            this.error = ''
        },
        restrictCashKey(event) {
            if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault()
        },
        closeCheckout() {
            localStorage.removeItem('posfood_checkout')
            const id =
                this.checkout.partialPayment?.sourceOrderId || this.checkout.id
            this.$router.push(
                id
                    ? { path: '/pos/start', query: { reopen: id } }
                    : '/pos/start',
            )
        },
        requestPayment() {
            this.error = ''
            if (this.paymentTotal <= 0)
                return (this.error =
                    'The payable amount must be greater than RM 0.00.')
            if (this.cashShortfall)
                return (this.error =
                    'Cash received is less than the amount due.')
            if (this.paymentMethod === 'Bank' && !this.bankReference)
                return (this.error = 'Enter the bank transaction reference.')
            this.showConfirm = true
        },
        completePayment() {
            const account = JSON.parse(
                localStorage.getItem('posfood_active_account') || '{}',
            )
            const partial = this.checkout.partialPayment
            const remainingGroups = partial?.remainingOrder?.orderGroups || []
            const hasRemaining = remainingGroups.some(
                (group) => (group.items || []).length,
            )
            const receiptId = `SALE-${Date.now()}`
            const sourceId = partial?.sourceOrderId || this.checkout.id
            const splitSessionId =
                partial?.splitSessionId || this.checkout.splitSessionId || ''
            const priorSplitReceipts = this.readList('posfood_sales').filter(
                (sale) =>
                    splitSessionId && sale.splitSessionId === splitSessionId,
            )
            const splitPaymentNumber = Number(
                partial?.paymentNumber ||
                    this.checkout.splitPaymentNumber ||
                    priorSplitReceipts.length + 1,
            )
            const reference =
                this.paymentMethod === 'Bank'
                    ? this.bankReference
                    : this.paymentMethod === 'E-Wallet'
                      ? `${this.walletProvider}-${String(Date.now()).slice(-8)}`
                      : ''
            const receipt = {
                ...this.checkout,
                id: receiptId,
                status: 'paid',
                subtotal: this.paymentSubtotal,
                tax: this.paymentTax,
                total: this.paymentTotal,
                employeeId:
                    this.checkout.employeeId || account.employeeId || 'EMP001',
                paymentMethod: this.paymentMethod,
                paymentProvider:
                    this.paymentMethod === 'E-Wallet'
                        ? this.walletProvider
                        : void 0,
                cashReceived:
                    this.paymentMethod === 'Cash'
                        ? Number(this.cashReceived)
                        : this.paymentTotal,
                change:
                    this.paymentMethod === 'Cash'
                        ? Number(this.change.toFixed(2))
                        : 0,
                reference,
                splitPayment: Boolean(
                    partial || this.checkout.splitPayment || splitSessionId,
                ),
                splitSessionId: splitSessionId || void 0,
                splitPaymentNumber,
                hasRemaining,
                remainingTotal: hasRemaining
                    ? Number(partial.remainingOrder.total || 0)
                    : 0,
                createdAt: this.checkout.createdAt || new Date().toISOString(),
                paidAt: new Date().toISOString(),
            }
            delete receipt.partialPayment
            const storedHeld = this.readList('posfood_held_orders')
            const sourceIds = [
                ...new Set(
                    [
                        ...(partial?.sourceOrderIds ||
                            this.checkout.sourceOrderIds ||
                            this.checkout.orders?.map((order) => order.id) ||
                            []),
                        sourceId,
                    ].filter(Boolean),
                ),
            ]
            const existingHeld = sourceIds.length
                ? storedHeld.filter((order) => !sourceIds.includes(order.id))
                : storedHeld.filter(
                      (order) =>
                          order.orderNumber !== this.checkout.orderNumber,
                  )
            if (hasRemaining) {
                const baseRemaining = partial.remainingOrder
                const remaining = {
                    ...baseRemaining,
                    id: sourceId || baseRemaining.id || `HOLD-${Date.now()}`,
                    status: 'unpaid',
                    splitPayment: true,
                    splitSessionId:
                        splitSessionId ||
                        baseRemaining.splitSessionId ||
                        sourceId,
                    splitPaymentCount: splitPaymentNumber,
                    paidReceiptIds: [
                        ...(baseRemaining.paidReceiptIds || []),
                        receiptId,
                    ],
                    heldAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
                localStorage.setItem(
                    'posfood_held_orders',
                    JSON.stringify([remaining, ...existingHeld]),
                )
                receipt.remainingOrderId = remaining.id
            } else {
                localStorage.setItem(
                    'posfood_held_orders',
                    JSON.stringify(existingHeld),
                )
                localStorage.removeItem('posfood_order_draft')
                localStorage.removeItem('posfood_order_setup')
            }
            localStorage.removeItem('posfood_checkout')
            localStorage.setItem(
                'posfood_sales',
                JSON.stringify([receipt, ...this.readList('posfood_sales')]),
            )
            localStorage.setItem(
                'posfood_last_receipt',
                JSON.stringify(receipt),
            )
            this.completedReceipt = receipt
            this.showConfirm = false
            this.showSuccess = true
        },
        finishPayment(showReceipt) {
            const receipt = this.completedReceipt
            if (showReceipt) {
                this.showSuccess = false
                this.showReceiptModal = true
                return
            }
            const id = receipt?.hasRemaining ? receipt.remainingOrderId : ''
            this.$router.replace(
                id
                    ? { path: '/pos/start', query: { reopen: id } }
                    : '/pos/start',
            )
        },
        closeReceiptAndFinish() {
            this.showReceiptModal = false
            this.finishPayment(false)
        },
        printReceipt() {
            window.print()
        },
    },
}
</script>
