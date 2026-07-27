<template>
    <main class="transactions-page">
        <section class="transactions-shell">
            <PosTopbar />
            <section class="workspace">
                <div class="page-title">
                    <div>
                        <span>ACTIVITY</span>
                        <h2>History</h2>
                        <p>
                            Read-only record of completed orders and receipts.
                        </p>
                    </div>
                </div>
                <div class="filters">
                    <button
                        v-for="filter in typeFilters"
                        :key="filter"
                        type="button"
                        :class="{ active: activeType === filter }"
                        @click="activeType = filter"
                    >
                        {{ filter }}
                    </button>
                    <select v-model="selectedTable">
                        <option value="All">All tables</option>
                        <option v-for="table in tableOptions" :key="table">
                            {{ table }}
                        </option>
                    </select>
                </div>
                <div class="transaction-list">
                    <article
                        v-for="transaction in pagedTransactions"
                        :key="transaction.id"
                        @click="openTransaction(transaction)"
                    >
                        <div class="type-icon">
                            <i
                                class="fa-solid"
                                :class="
                                    transaction.orderSetup?.orderType ===
                                    'Takeaway'
                                        ? 'fa-bag-shopping'
                                        : 'fa-utensils'
                                "
                            ></i>
                        </div>
                        <div class="transaction-copy">
                            <span
                                >{{
                                    transaction.orderSetup?.orderType ||
                                    transaction.orderType
                                }}<template v-if="tableNumber(transaction)">
                                    · {{ tableNumber(transaction) }}</template
                                ></span
                            >
                            <h3>{{ transaction.orderNumber }}</h3>
                            <small>{{
                                formatDate(
                                    transaction.paidAt ||
                                        transaction.heldAt ||
                                        transaction.createdAt,
                                )
                            }}</small>
                        </div>
                        <div class="item-preview">
                            <strong>{{ itemCount(transaction) }} items</strong
                            ><span>{{
                                transaction.items
                                    ?.map((item) => item.name)
                                    .join(', ')
                            }}</span>
                        </div>
                        <div class="transaction-end">
                            <span
                                class="status"
                                :class="
                                    transaction.__splitHistory
                                        ? 'split'
                                        : 'paid'
                                "
                                >{{
                                    transaction.__splitHistory
                                        ? 'SPLIT'
                                        : 'PAID'
                                }}</span
                            ><strong class="transaction-total"
                                >RM {{ money(transaction.total) }}</strong
                            ><i class="fa-solid fa-chevron-right"></i>
                        </div>
                    </article>
                    <div v-if="!filteredTransactions.length" class="empty">
                        <i class="fa-solid fa-receipt"></i>
                        <h3>No transactions</h3>
                        <p>Try another order type or table.</p>
                    </div>
                </div>
                <nav
                    v-if="totalPages > 1"
                    class="transaction-pagination"
                    aria-label="Transaction pages"
                >
                    <button
                        type="button"
                        :disabled="currentPage === 1"
                        @click="currentPage--"
                    >
                        <i class="fa-solid fa-chevron-left"></i></button
                    ><span
                        >Page <strong>{{ currentPage }}</strong> of
                        {{ totalPages }}</span
                    ><button
                        type="button"
                        :disabled="currentPage === totalPages"
                        @click="currentPage++"
                    >
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </nav>
            </section>
        </section>

        <div
            v-if="selectedTransaction"
            class="modal-backdrop"
            @click.self="selectedTransaction = null"
        >
            <section
                class="transaction-modal"
                :class="{ 'receipt-modal': detailPage > 0 }"
            >
                <time
                    v-if="detailPage === 0"
                    class="checkout-time modal-checkout-time"
                    ><i class="fa-regular fa-clock"></i>Checkout ·
                    {{ checkoutTime(selectedTransaction) }}</time
                >
                <div class="modal-corner-actions">
                    <button
                        v-if="detailPage === 0"
                        type="button"
                        class="modal-receipt"
                        aria-label="Show receipt"
                        @click="nextReceipt"
                    >
                        <i class="fa-solid fa-receipt"></i></button
                    ><button
                        type="button"
                        class="close"
                        @click="selectedTransaction = null"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <header class="modal-header">
                    <button
                        v-if="detailPage > 0"
                        type="button"
                        class="detail-back"
                        aria-label="Back to product details"
                        @click="detailPage = 0"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <span>{{
                            detailPage === 0
                                ? 'PRODUCT DETAILS'
                                : `RECEIPT ${detailPage} OF ${receiptPages.length}`
                        }}</span>
                        <h2>{{ selectedTransaction.orderNumber }}</h2>
                    </div>
                </header>

                <div v-if="detailPage === 0" class="product-details">
                    <div class="history-groups-scroll">
                        <section
                            v-for="(group, groupIndex) in historyProductGroups"
                            :key="`${selectedTransaction.id}-${groupIndex}`"
                            class="history-payment-group"
                        >
                            <header v-if="selectedTransaction.__splitHistory">
                                <span>Payment {{ groupIndex + 1 }}</span
                                ><strong
                                    >{{ group.paymentMethod }} · RM
                                    {{ money(group.total) }}</strong
                                >
                            </header>
                            <article
                                v-for="item in group.items"
                                :key="item.key || `${item.name}-${groupIndex}`"
                            >
                                <img :src="item.image" :alt="item.name" />
                                <div>
                                    <h3>{{ item.name }}</h3>
                                    <p>
                                        {{
                                            item.optionLines?.join(' · ') ||
                                            item.size ||
                                            'Regular'
                                        }}
                                    </p>
                                    <small v-if="item.remark"
                                        ><i
                                            class="fa-regular fa-note-sticky"
                                        ></i
                                        >{{ item.remark }}</small
                                    >
                                </div>
                                <strong>{{ item.qty }}×</strong
                                ><b>RM {{ money(item.total) }}</b>
                            </article>
                        </section>
                    </div>
                    <section class="history-order-summary">
                        <div>
                            <i class="fa-solid fa-coins"></i
                            ><span>Grand total</span
                            ><strong
                                >RM
                                {{ money(selectedTransaction.total) }}</strong
                            >
                        </div>
                        <div>
                            <i class="fa-solid fa-credit-card"></i
                            ><span>Payment method</span
                            ><strong>{{
                                paymentLabel(selectedTransaction)
                            }}</strong>
                        </div>
                        <div>
                            <i class="fa-solid fa-user"></i
                            ><span>Handled by</span
                            ><strong>{{
                                employeeLabel(selectedTransaction)
                            }}</strong>
                        </div>
                    </section>
                </div>
                <div v-else class="receipt-view">
                    <button
                        v-if="receiptPages.length > 1"
                        type="button"
                        class="receipt-side-arrow previous"
                        aria-label="Previous receipt"
                        @click="previousReceipt"
                    >
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <div class="receipt-paper-scroll">
                        <ThermalReceipt :receipt="currentReceipt" compact />
                    </div>
                    <button
                        v-if="receiptPages.length > 1"
                        type="button"
                        class="receipt-side-arrow next"
                        aria-label="Next receipt"
                        @click="nextReceipt"
                    >
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                <footer :class="{ 'print-footer': detailPage > 0 }">
                    <div class="page-dots">
                        <button
                            v-for="page in detailPageCount"
                            :key="page"
                            :class="{ active: detailPage === page - 1 }"
                            @click="detailPage = page - 1"
                        ></button>
                    </div>
                    <button
                        v-if="detailPage > 0"
                        type="button"
                        class="print-button"
                        @click="printTransaction"
                    >
                        <i class="fa-solid fa-print"></i>Print receipt
                    </button>
                </footer>
            </section>
        </div>
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import ThermalReceipt from '@/components/receipt/ThermalReceipt.vue'
import { createDemoTransactions } from '@/data/transactions.js'
import { readList } from '@/services/pos/storage.js'
export default {
    name: 'POSTransactions',
    components: { PosTopbar, ThermalReceipt },
    data() {
        return {
            keyword: '',
            activeType: 'All',
            selectedTable: 'All',
            selectedTransaction: null,
            detailPage: 0,
            currentPage: 1,
            pageSize: 5,
            typeFilters: ['All', 'Dine In', 'Takeaway'],
            transactions: [],
        }
    },
    computed: {
        tableOptions() {
            return [
                ...new Set(
                    this.transactions
                        .map((item) => this.tableNumber(item))
                        .filter(Boolean),
                ),
            ].sort()
        },
        filteredTransactions() {
            const search = this.keyword.toLowerCase()
            return this.transactions.filter((item) => {
                const type = item.orderSetup?.orderType || item.orderType
                const table = this.tableNumber(item)
                return (
                    (this.activeType === 'All' || type === this.activeType) &&
                    (this.selectedTable === 'All' ||
                        table === this.selectedTable) &&
                    (!search ||
                        String(item.orderNumber)
                            .toLowerCase()
                            .includes(search) ||
                        String(table).toLowerCase().includes(search))
                )
            })
        },
        totalPages() {
            return Math.max(
                1,
                Math.ceil(this.filteredTransactions.length / this.pageSize),
            )
        },
        pagedTransactions() {
            const start = (this.currentPage - 1) * this.pageSize
            return this.filteredTransactions.slice(start, start + this.pageSize)
        },
        receiptPages() {
            if (!this.selectedTransaction) return []
            return this.selectedTransaction.receipts?.length
                ? this.selectedTransaction.receipts
                : [this.selectedTransaction]
        },
        detailPageCount() {
            return this.receiptPages.length + 1
        },
        currentReceipt() {
            return (
                this.receiptPages[Math.max(0, this.detailPage - 1)] ||
                this.selectedTransaction ||
                {}
            )
        },
        historyProductGroups() {
            if (!this.selectedTransaction) return []
            return this.selectedTransaction.__splitHistory
                ? this.receiptPages.map((receipt) => ({
                      items: receipt.items || [],
                      paymentMethod: receipt.paymentMethod,
                      total: receipt.total,
                  }))
                : [
                      {
                          items: this.selectedTransaction.items || [],
                          paymentMethod: this.selectedTransaction.paymentMethod,
                          total: this.selectedTransaction.total,
                      },
                  ]
        },
    },
    watch: {
        keyword() {
            this.currentPage = 1
        },
        activeType() {
            this.currentPage = 1
        },
        selectedTable() {
            this.currentPage = 1
        },
    },
    mounted() {
        if (!localStorage.getItem('posfood_active_account'))
            return this.$router.push('/')
        this.loadTransactions()
    },
    methods: {
        loadTransactions() {
            const saved = readList('posfood_sales').map((item) => ({
                ...item,
                status: 'paid',
            }))
            const unique = [...saved, ...createDemoTransactions()].filter(
                (item, index, array) =>
                    array.findIndex((other) => other.id === item.id) === index,
            )
            const regular = []
            const splitGroups = new Map()
            unique.forEach((item) => {
                if (item.splitSessionId) {
                    if (!splitGroups.has(item.splitSessionId))
                        splitGroups.set(item.splitSessionId, [])
                    splitGroups.get(item.splitSessionId).push(item)
                } else regular.push(item)
            })
            const split = [...splitGroups.entries()].map(
                ([sessionId, receipts]) => {
                    receipts.sort(
                        (a, b) =>
                            Number(a.splitPaymentNumber || 0) -
                                Number(b.splitPaymentNumber || 0) ||
                            new Date(a.paidAt) - new Date(b.paidAt),
                    )
                    const first = receipts[0],
                        latest = receipts[receipts.length - 1]
                    return {
                        ...first,
                        id: `SPLIT-HISTORY-${sessionId}`,
                        __splitHistory: true,
                        splitSessionId: sessionId,
                        receipts,
                        items: receipts.flatMap(
                            (receipt) => receipt.items || [],
                        ),
                        subtotal: receipts.reduce(
                            (sum, receipt) =>
                                sum + Number(receipt.subtotal || 0),
                            0,
                        ),
                        tax: receipts.reduce(
                            (sum, receipt) => sum + Number(receipt.tax || 0),
                            0,
                        ),
                        total: receipts.reduce(
                            (sum, receipt) => sum + Number(receipt.total || 0),
                            0,
                        ),
                        paidAt: latest.paidAt,
                    }
                },
            )
            this.transactions = [...regular, ...split].sort(
                (a, b) =>
                    new Date(b.paidAt || b.createdAt) -
                    new Date(a.paidAt || a.createdAt),
            )
        },
        tableNumber(item) {
            return item.orderSetup?.tableNumber || item.tableNumber || ''
        },
        itemCount(item) {
            return (item.items || []).reduce(
                (total, product) => total + Number(product.qty || 0),
                0,
            )
        },
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        formatDate(value) {
            return value
                ? new Intl.DateTimeFormat('en-MY', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                  }).format(new Date(value))
                : '-'
        },
        checkoutTime(item) {
            const payments = (item?.receipts?.length ? item.receipts : [item])
                .map(
                    (receipt) =>
                        receipt?.paidAt ||
                        receipt?.completedAt ||
                        receipt?.createdAt,
                )
                .filter(Boolean)
                .map((value) => new Date(value))
                .filter((value) => !Number.isNaN(value.getTime()))
            if (!payments.length) return '-'
            const latest = new Date(
                Math.max(...payments.map((value) => value.getTime())),
            )
            return new Intl.DateTimeFormat('en-MY', {
                hour: '2-digit',
                minute: '2-digit',
            }).format(latest)
        },
        employeeLabel(item) {
            return (
                item.cashier ||
                item.employeeId ||
                item.receipts?.[0]?.cashier ||
                item.receipts?.[0]?.employeeId ||
                'EMP001'
            )
        },
        paymentLabel(item) {
            const methods = [
                ...new Set(
                    (item.receipts?.length ? item.receipts : [item])
                        .map((receipt) => receipt.paymentMethod)
                        .filter(Boolean),
                ),
            ]
            return methods.join(' / ') || 'Payment'
        },
        openTransaction(item) {
            this.selectedTransaction = item
            this.detailPage = 0
        },
        nextReceipt() {
            if (!this.receiptPages.length) return
            this.detailPage =
                this.detailPage === 0 ||
                this.detailPage >= this.receiptPages.length
                    ? 1
                    : this.detailPage + 1
        },
        previousReceipt() {
            if (!this.receiptPages.length) return
            this.detailPage =
                this.detailPage <= 1
                    ? this.receiptPages.length
                    : this.detailPage - 1
        },
        printTransaction() {
            const receipt = this.currentReceipt
            localStorage.setItem(
                'posfood_last_receipt',
                JSON.stringify(receipt),
            )
            this.$router.push({
                path: `/pos/receipt/${receipt.id}`,
                query: { print: '1' },
            })
        },
    },
}
</script>
