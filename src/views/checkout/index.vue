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
                    <div class="payment-header-actions">
                        <button
                            type="button"
                            class="payment-member-button"
                            aria-label="Register member"
                            title="Register member"
                            @click="handleMemberButton"
                        >
                            <i class="fa-solid fa-user"></i>
                        </button>
                        <button
                            type="button"
                            class="payment-close"
                            aria-label="Close payment"
                            @click="closeCheckout"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
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

                    <section
                        class="checkout-member-verification"
                        :class="{ verified: memberVerified }"
                        aria-live="polite"
                    >
                        <template v-if="memberVerified">
                            <i class="fa-solid fa-circle-check"></i>
                        </template>
                        <template v-else>
                            <label>
                                <i class="fa-solid fa-phone"></i>
                                <input
                                    v-model.trim="memberVerificationPhone"
                                    type="tel"
                                    inputmode="tel"
                                    placeholder="Verify member phone number"
                                    @input="resetMemberVerification"
                                />
                            </label>
                            <button type="button" @click="verifyMember">
                                Verify
                            </button>
                        </template>
                        <p v-if="memberVerificationError">
                            {{ memberVerificationError }}
                        </p>
                    </section>

                    <section class="checkout-voucher-panel">
                        <header class="voucher-section-heading">
                            <i class="fa-solid fa-ticket"></i>
                            <div>
                                <strong>Voucher</strong>
                                <span>Optional</span>
                            </div>
                        </header>
                        <form
                            class="voucher-entry-row"
                            @submit.prevent="applyVoucherCode"
                        >
                            <label>
                                <i class="fa-solid fa-ticket"></i>
                                <input
                                    v-model.trim="voucherCode"
                                    type="text"
                                    placeholder="Enter voucher code"
                                    data-keyboard-mode="voucher"
                                    autocapitalize="characters"
                                    spellcheck="false"
                                    @input="handleVoucherInput"
                                    @change="applyVoucherCode"
                                />
                                <button
                                    v-if="appliedVoucher"
                                    type="button"
                                    class="clear-voucher-button"
                                    aria-label="Remove selected voucher"
                                    title="Remove voucher"
                                    @click.prevent.stop="removeVoucher"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </label>
                            <button
                                type="button"
                                class="scan-voucher-button"
                                aria-label="Scan voucher QR"
                                title="Scan voucher QR"
                                @click="showVoucherScanner = true"
                            >
                                <i class="fa-solid fa-qrcode"></i>
                            </button>
                        </form>
                        <button
                            v-if="availableVouchers.length"
                            type="button"
                            class="checkout-voucher-list-trigger"
                            @click="openVoucherList"
                        >
                            <span>
                                <strong>Choose voucher</strong>
                                <small>{{ availableVouchers.length }} available to review</small>
                            </span>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <p v-else class="member-voucher-empty">
                            {{
                                memberVerified
                                    ? 'No member voucher is available.'
                                    : 'Verify a member to view their vouchers.'
                            }}
                        </p>
                        <p
                            v-if="voucherError"
                            class="voucher-validation-error"
                        >
                            {{ voucherError }}
                        </p>
                    </section>
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
            v-if="showVoucherList"
            class="module-modal-backdrop"
            @click.self="showVoucherList = false"
        >
            <section class="member-voucher-list-modal checkout-voucher-list-modal">
                <header>
                    <div>
                        <span>VOUCHERS</span>
                        <h2>Choose voucher</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close voucher list"
                        @click="showVoucherList = false"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="member-voucher-detail-list">
                    <button
                        v-for="voucher in availableVouchers"
                        :key="voucher.id"
                        type="button"
                        class="checkout-voucher-option"
                        :class="{
                            active: appliedVoucher?.id === voucher.id,
                            ineligible: !voucherValidation(voucher).valid,
                        }"
                        @click="chooseVoucherFromList(voucher)"
                    >
                        <strong>{{ voucher.code }}</strong>
                        <span>
                            <small>Minimum spend</small>
                            <b>RM {{ money(voucher.minSpend) }}</b>
                        </span>
                        <span>
                            <small>Validity</small>
                            <b>{{ voucherValidity(voucher) }}</b>
                        </span>
                        <span>
                            <small>Time</small>
                            <b>{{ voucherTime(voucher) }}</b>
                        </span>
                        <em>{{ voucherOfferLabel(voucher) }}</em>
                        <i
                            class="fa-solid"
                            :class="appliedVoucher?.id === voucher.id
                                ? 'fa-circle-check'
                                : 'fa-chevron-right'"
                        ></i>
                        <small
                            v-if="voucherListReasonId === voucher.id"
                            class="checkout-voucher-option-reason"
                        >
                            {{ voucherValidation(voucher).reason }}
                        </small>
                    </button>
                </div>
            </section>
        </div>

        <div
            v-if="showMemberChangePrompt"
            class="confirm-backdrop"
            @click.self="showMemberChangePrompt = false"
        >
            <section class="checkout-member-change-modal">
                <button
                    type="button"
                    class="member-dialog-close"
                    aria-label="Close member options"
                    @click="showMemberChangePrompt = false"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div><i class="fa-solid fa-user-pen"></i></div>
                <h2>Member account</h2>
                <p>
                    {{ checkout.member?.name }} is currently attached to this
                    order.
                </p>
                <footer>
                    <button
                        type="button"
                        class="member-logout-button"
                        @click="logoutMember"
                    >
                        Logout
                    </button>
                    <button type="button" @click="confirmMemberChange">
                        Change account
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="showMemberPicker"
            class="confirm-backdrop"
            @click.self="showMemberPicker = false"
        >
            <section
                class="checkout-member-picker-modal"
                :class="{ 'register-mode': memberRegisterMode }"
            >
                <header>
                    <div>
                        <span>MEMBERSHIP</span>
                        <h2>
                            {{
                                memberRegisterMode
                                    ? 'Register member'
                                    : 'Sign in member'
                            }}
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close member picker"
                        @click="showMemberPicker = false"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <template v-if="!memberRegisterMode">
                <label class="checkout-member-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input
                        v-model.trim="memberQuery"
                        type="search"
                        placeholder="Name, phone or Member ID"
                        autofocus
                    />
                </label>
                <div class="checkout-member-results">
                    <button
                        v-for="member in memberResults"
                        :key="member.id"
                        type="button"
                        @click="attachMember(member)"
                    >
                        <span>{{ memberInitials(member.name) }}</span>
                        <div>
                            <strong>{{ member.name }}</strong>
                            <small>
                                {{ member.memberId }} · {{ member.phone }}
                            </small>
                        </div>
                        <b>{{ member.points }} pts</b>
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                    <p v-if="!memberResults.length">
                        No active member found.
                    </p>
                </div>
                <button
                    type="button"
                    class="checkout-member-register-link"
                    @click="openMemberRegister"
                >
                    Register
                </button>
                </template>

                <form
                    v-else
                    class="checkout-member-register-form"
                    @submit.prevent="registerAndAttachMember"
                >
                    <MemberFormFields v-model="memberRegisterForm" />
                    <p v-if="memberRegisterError">
                        {{ memberRegisterError }}
                    </p>
                    <footer>
                        <button
                            type="button"
                            @click="memberRegisterMode = false"
                        >
                            Back
                        </button>
                        <button type="submit">Register</button>
                    </footer>
                </form>
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
        <CameraScannerModal
            v-if="showVoucherScanner"
            title="Scan voucher QR"
            subtitle="The QR code should contain the voucher code"
            center-action
            @close="showVoucherScanner = false"
            @action="showVoucherScanner = false"
            @scanned="applyScannedVoucher"
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
import CameraScannerModal from '@/components/common/CameraScannerModal.vue'
import MemberFormFields from '@/components/membership/MemberFormFields.vue'
import {
    findMember,
    loadMembers,
    recordMemberSale,
    saveMember,
} from '@/services/pos/memberships.js'
import { readList as readStoredList } from '@/services/pos/storage.js'
import { loadNotifications } from '@/services/pos/notifications.js'
import {
    calculateVoucherDiscount,
    findVoucherByCode,
    loadVouchers,
    recordVoucherRedemption,
    validateVoucher,
    voucherStatus,
} from '@/services/pos/vouchers.js'
import { normalizeCheckout } from '@/utils/order.js'
export default {
    name: 'POSCheckout',
    components: {
        CameraScannerModal,
        MemberFormFields,
        POSDashboard,
        QrZoomModal,
        ThermalReceipt,
    },
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
            voucherCode: '',
            appliedVoucher: null,
            voucherDiscount: 0,
            voucherError: '',
            showVoucherScanner: false,
            members: [],
            vouchers: [],
            memberQuery: '',
            showMemberPicker: false,
            showMemberChangePrompt: false,
            memberRegisterMode: false,
            memberRegisterForm: {
                name: '',
                phone: '',
                email: '',
                birthday: '',
                note: '',
            },
            memberRegisterError: '',
            memberVerificationPhone: '',
            memberVerificationError: '',
            memberVerified: false,
            showVoucherList: false,
            voucherListReasonId: '',
            kitchenNotifications: loadNotifications(),
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
            return Math.max(
                0,
                Number(this.checkout.total || 0) - this.voucherDiscount,
            )
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
            return (
                this.paymentTotal > 0 &&
                !this.cashShortfall &&
                !this.hasPendingKitchenIssue
            )
        },
        hasPendingKitchenIssue() {
            if (this.checkout.partialPayment) return false
            const orderId = String(this.checkout.id || '')
            const orderNumber = String(
                this.checkout.orderNumber ||
                    this.checkout.orderSetup?.orderNo ||
                    '',
            ).replace(/^#/, '')
            return this.kitchenNotifications.some((notification) => {
                if (notification.resolved) return false
                return (
                    (orderId &&
                        String(notification.orderId || '') === orderId) ||
                    (orderNumber &&
                        String(notification.orderNumber || '').replace(
                            /^#/,
                            '',
                        ) === orderNumber)
                )
            })
        },
        isSplitPayment() {
            return Boolean(
                this.checkout.partialPayment ||
                    this.checkout.splitPayment ||
                    this.checkout.splitSessionId,
            )
        },
        memberResults() {
            const keyword = this.memberQuery.toLowerCase()
            return this.members.filter((member) => {
                if (member.status !== 'active') return false
                if (!keyword) return true
                return [member.name, member.phone, member.memberId].some(
                    (value) => String(value || '').toLowerCase().includes(keyword),
                )
            })
        },
        availableVouchers() {
            if (!this.memberVerified || !this.checkout.member) return []
            return this.vouchers.filter(
                (voucher) => voucherStatus(voucher) === 'Active',
            )
        },
    },
    mounted() {
        try {
            const checkout = JSON.parse(
                localStorage.getItem('posfood_checkout'),
            )
            const hasItems =
                checkout?.items?.length ||
                checkout?.orderGroups?.some(
                    (group) => (group.items || []).length,
                )
            if (!hasItems)
                return this.$router.replace('/pos/start')
            this.checkout = normalizeCheckout(checkout)
            this.checkout.member = null
            if (this.hasPendingKitchenIssue)
                this.error =
                    'Kitchen requested an order update. Return to the order before payment.'
            this.members = loadMembers()
            this.vouchers = loadVouchers()
            if (checkout.voucher?.code) {
                this.voucherCode = checkout.voucher.code
                this.applyVoucherCode()
            }
            window.addEventListener(
                'pos-notifications:changed',
                this.syncKitchenNotifications,
            )
            window.addEventListener(
                'storage',
                this.syncKitchenNotifications,
            )
        } catch (error) {
            this.$router.replace('/pos/start')
        }
    },
    beforeUnmount() {
        window.removeEventListener(
            'pos-notifications:changed',
            this.syncKitchenNotifications,
        )
        window.removeEventListener('storage', this.syncKitchenNotifications)
    },
    methods: {
        syncKitchenNotifications(event) {
            this.kitchenNotifications = Array.isArray(event?.detail)
                ? event.detail
                : loadNotifications()
            if (this.hasPendingKitchenIssue) {
                this.showConfirm = false
                this.error =
                    'Kitchen requested an order update. Return to the order before payment.'
            }
        },
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
        handleMemberButton() {
            this.openMemberRegister()
            this.showMemberPicker = true
        },
        openMemberPicker() {
            this.members = loadMembers()
            this.memberQuery = ''
            this.memberRegisterMode = false
            this.memberRegisterError = ''
            this.showMemberPicker = true
        },
        openMemberRegister() {
            this.memberRegisterMode = true
            this.memberRegisterError = ''
            this.memberRegisterForm = {
                name: '',
                phone: '',
                email: '',
                birthday: '',
                note: '',
            }
        },
        registerAndAttachMember() {
            try {
                const member = saveMember(this.memberRegisterForm)
                this.members = loadMembers()
                this.memberVerificationPhone = member.phone
                this.showMemberPicker = false
                this.memberRegisterMode = false
                this.memberRegisterError = ''
            } catch (error) {
                this.memberRegisterError = error.message
            }
        },
        confirmMemberChange() {
            this.showMemberChangePrompt = false
            this.openMemberPicker()
        },
        logoutMember() {
            this.checkout.member = null
            clearCurrentMember()
            localStorage.setItem(
                'posfood_checkout',
                JSON.stringify(this.checkout),
            )
            this.showMemberChangePrompt = false
            if (this.appliedVoucher) {
                const validation = validateVoucher(
                    this.appliedVoucher,
                    this.checkout,
                    null,
                )
                if (!validation.valid) this.removeVoucher()
            }
        },
        memberInitials(name) {
            return String(name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
        attachMember(member) {
            this.checkout.member = { ...member }
            this.memberVerified = true
            localStorage.setItem(
                'posfood_checkout',
                JSON.stringify(this.checkout),
            )
            this.showMemberPicker = false
            this.showMemberChangePrompt = false
            this.cashReceived = 0
            if (this.appliedVoucher) {
                const validation = validateVoucher(
                    this.appliedVoucher,
                    this.checkout,
                    this.checkout.member,
                )
                if (!validation.valid) this.removeVoucher()
            }
        },
        resetMemberVerification() {
            this.memberVerificationError = ''
            if (!this.memberVerified) return
            this.memberVerified = false
            this.checkout.member = null
            if (this.appliedVoucher?.memberOnly) this.removeVoucher()
        },
        verifyMember() {
            const member = findMember(this.memberVerificationPhone)
            if (!member) {
                this.memberVerificationError =
                    'No active member matches this phone number.'
                this.memberVerified = false
                this.checkout.member = null
                return
            }
            this.memberVerificationError = ''
            this.memberVerificationPhone = member.phone
            this.attachMember(member)
        },
        voucherOfferLabel(voucher) {
            const value = Number(voucher?.value || 0)
            const compactValue = Number.isInteger(value)
                ? String(value)
                : value.toFixed(2)
            return voucher?.type === 'percentage'
                ? `${compactValue}%`
                : `RM${compactValue}`
        },
        voucherValidation(voucher) {
            return validateVoucher(
                voucher,
                this.checkout,
                this.checkout.member,
            )
        },
        voucherValidity(voucher) {
            if (!voucher.startDate && !voucher.endDate) return 'No date limit'
            return `${this.shortVoucherDate(voucher.startDate) || 'Now'} - ${
                this.shortVoucherDate(voucher.endDate) || 'No expiry'
            }`
        },
        voucherTime(voucher) {
            return voucher.startTime && voucher.endTime
                ? `${voucher.startTime} - ${voucher.endTime}`
                : 'All day'
        },
        shortVoucherDate(value) {
            if (!value) return ''
            const date = new Date(`${value}T00:00:00`)
            return Number.isNaN(date.getTime())
                ? value
                : date.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                  })
        },
        openVoucherList() {
            this.voucherListReasonId = ''
            this.showVoucherList = true
        },
        chooseVoucherFromList(voucher) {
            const validation = this.voucherValidation(voucher)
            if (!validation.valid) {
                this.voucherListReasonId = voucher.id
                return
            }
            this.voucherListReasonId = ''
            this.selectMemberVoucher(voucher)
            this.showVoucherList = false
        },
        selectMemberVoucher(voucher) {
            if (this.appliedVoucher?.id === voucher.id) {
                this.removeVoucher()
                return
            }
            this.voucherCode = voucher.code
            this.applyVoucher(voucher)
        },
        applyVoucherCode() {
            this.voucherCode = String(this.voucherCode || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
            this.applyVoucher(findVoucherByCode(this.voucherCode))
        },
        handleVoucherInput(event) {
            const code = String(event.target.value || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
            this.voucherCode = code
            if (event.target.value !== code) event.target.value = code
            const voucher = findVoucherByCode(code)
            if (voucher) {
                this.applyVoucher(voucher)
                return
            }
            if (this.appliedVoucher?.code !== code) {
                this.appliedVoucher = null
                this.voucherDiscount = 0
                this.voucherError = ''
            }
        },
        applyVoucher(voucher) {
            this.voucherError = ''
            const usedExactAmount =
                this.paymentMethod === 'Cash' &&
                Number(this.cashReceived) === this.paymentTotal
            const validation = validateVoucher(
                voucher,
                this.checkout,
                this.checkout.member,
            )
            if (!validation.valid) {
                this.voucherError = validation.reason
                return
            }
            this.appliedVoucher = voucher
            this.voucherDiscount = calculateVoucherDiscount(
                voucher,
                this.checkout,
            )
            this.voucherCode = voucher.code
            this.cashReceived = usedExactAmount ? this.paymentTotal : 0
        },
        applyScannedVoucher(value) {
            this.showVoucherScanner = false
            this.voucherCode = String(value || '')
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
            this.applyVoucherCode()
        },
        removeVoucher() {
            const usedExactAmount =
                this.paymentMethod === 'Cash' &&
                Number(this.cashReceived) === this.paymentTotal
            this.appliedVoucher = null
            this.voucherDiscount = 0
            this.voucherCode = ''
            this.voucherError = ''
            this.cashReceived = usedExactAmount ? this.paymentTotal : 0
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
            if (this.hasPendingKitchenIssue)
                return (this.error =
                    'Kitchen requested an order update. Return to the order before payment.')
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
            if (this.hasPendingKitchenIssue) {
                this.showConfirm = false
                this.error =
                    'Kitchen requested an order update. Payment is blocked.'
                return
            }
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
                member: this.checkout.member || null,
                voucher: this.appliedVoucher
                    ? {
                          id: this.appliedVoucher.id,
                          code: this.appliedVoucher.code,
                          name: this.appliedVoucher.name,
                      }
                    : null,
                voucherDiscount: this.voucherDiscount,
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
            if (this.appliedVoucher)
                recordVoucherRedemption(
                    this.appliedVoucher,
                    receipt,
                    this.checkout.member,
                )
            if (this.checkout.member?.id)
                recordMemberSale(this.checkout.member.id, receipt)
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
            this.showSuccess = true
        },
        printReceipt() {
            window.print()
        },
    },
}
</script>
