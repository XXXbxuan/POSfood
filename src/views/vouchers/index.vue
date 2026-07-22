<template>
    <main class="restro-page voucher-page">
        <section class="restro-shell voucher-shell">
            <PosTopbar>
                <template #actions>
                    <button
                        type="button"
                        class="module-primary-action"
                        @click="openCreate"
                    >
                        <i class="fa-solid fa-plus"></i>Create voucher
                    </button>
                </template>
            </PosTopbar>

            <section class="module-page-content">
                <header class="module-heading">
                    <div>
                        <span>VOUCHERS</span>
                        <h2>Discount campaigns</h2>
                        <p>
                            Set usage limits and order conditions for every
                            voucher.
                        </p>
                    </div>
                    <label class="module-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input
                            v-model.trim="query"
                            type="search"
                            placeholder="Voucher code"
                            data-keyboard-mode="voucher"
                            autocapitalize="characters"
                            spellcheck="false"
                        />
                    </label>
                </header>

                <nav class="voucher-filter-bar">
                    <button
                        v-for="filter in filters"
                        :key="filter"
                        type="button"
                        :class="{ active: activeFilter === filter }"
                        @click="activeFilter = filter"
                    >
                        {{ filter }}<span>{{ statusCount(filter) }}</span>
                    </button>
                </nav>

                <section
                    v-if="filteredVouchers.length"
                    class="voucher-card-grid"
                >
                    <article
                        v-for="voucher in filteredVouchers"
                        :key="voucher.id"
                        class="voucher-card"
                        role="button"
                        tabindex="0"
                        :aria-label="`Edit ${voucher.code}`"
                        @click="openEdit(voucher)"
                        @keydown.enter="openEdit(voucher)"
                        @keydown.space.prevent="openEdit(voucher)"
                    >
                        <strong class="voucher-discount-corner">
                            {{ discountLabel(voucher) }}
                        </strong>
                        <header>
                            <button
                                type="button"
                                class="voucher-code"
                                title="Copy voucher code"
                                @click.stop="copyCode(voucher.code)"
                            >
                                <strong>{{ voucher.code }}</strong>
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button
                                type="button"
                                class="voucher-card-print"
                                aria-label="Print voucher"
                                title="Print voucher"
                                @click.stop="openVoucherPrint(voucher)"
                            >
                                <i class="fa-solid fa-print"></i>
                            </button>
                        </header>
                        <span
                            class="voucher-status"
                            :class="statusClass(voucher)"
                        >
                            {{ voucherStatus(voucher) }}
                        </span>
                        <dl>
                            <div>
                                <dt>Minimum spend</dt>
                                <dd>RM {{ money(voucher.minSpend) }}</dd>
                            </div>
                            <div>
                                <dt>Service</dt>
                                <dd class="voucher-service-tags">
                                    <span
                                        v-for="service in voucher.serviceTypes"
                                        :key="service"
                                    >
                                        {{ service }}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt>Validity</dt>
                                <dd
                                    class="voucher-range"
                                    :class="{
                                        single:
                                            !voucher.startDate &&
                                            !voucher.endDate,
                                    }"
                                >
                                    <template
                                        v-if="
                                            voucher.startDate || voucher.endDate
                                        "
                                    >
                                        <span>{{
                                            shortDate(voucher.startDate) || 'Now'
                                        }}</span>
                                        <b>–</b>
                                        <span>{{
                                            shortDate(voucher.endDate) ||
                                            'No expiry'
                                        }}</span>
                                    </template>
                                    <span v-else>–</span>
                                </dd>
                            </div>
                            <div>
                                <dt>Time</dt>
                                <dd
                                    class="voucher-range"
                                    :class="{
                                        single:
                                            !voucher.startTime ||
                                            !voucher.endTime,
                                    }"
                                >
                                    <template
                                        v-if="
                                            voucher.startTime && voucher.endTime
                                        "
                                    >
                                        <span>{{ voucher.startTime }}</span>
                                        <b>–</b>
                                        <span>{{ voucher.endTime }}</span>
                                    </template>
                                    <span v-else>–</span>
                                </dd>
                            </div>
                        </dl>
                        <footer>
                            <span class="voucher-usage-stat">
                                <strong>
                                    <i class="fa-solid fa-users"></i>
                                    {{ usageCount(voucher) }}
                                </strong>
                                <span v-if="voucher.totalLimit">
                                    / {{ voucher.totalLimit }}
                                </span>
                            </span>
                            <span class="voucher-usage-stat">
                                <strong>
                                    <i class="fa-solid fa-user"></i>
                                    {{
                                        voucher.perMemberLimit
                                            ? `MAX : ${voucher.perMemberLimit}`
                                            : 'No limit'
                                    }}
                                </strong>
                            </span>
                        </footer>
                    </article>
                </section>

                <section v-else class="voucher-empty-state">
                    <i class="fa-solid fa-ticket"></i>
                    <h3>{{ emptyStateTitle }}</h3>
                    <p>{{ emptyStateMessage }}</p>
                    <button
                        v-if="activeFilter === 'All'"
                        type="button"
                        class="module-primary-action"
                        @click="openCreate"
                    >
                        Create voucher
                    </button>
                </section>
            </section>
        </section>

        <VoucherEditorModal
            v-if="showEditor"
            :initial-voucher="editorVoucher"
            :categories="categories"
            :services="services"
            :days="days"
            :menu-products="menuProducts"
            :save-error="formError"
            @close="closeEditor"
            @delete="removeVoucher"
            @save="submitVoucher"
        />

        <VoucherPrintModal
            v-if="printVoucher"
            :voucher="printVoucher"
            :auto-print="true"
            @close="closeVoucherPrint"
        />

        <transition name="voucher-toast">
            <p v-if="copyFeedback" class="voucher-copy-toast" role="status">
                <i class="fa-solid fa-circle-check"></i>
                {{ copyFeedback }}
            </p>
        </transition>
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import VoucherEditorModal from '@/components/voucher/VoucherEditorModal.vue'
import VoucherPrintModal from '@/components/voucher/VoucherPrintModal.vue'
import { loadMenuCatalog } from '@/services/pos/menuCatalog.js'
import {
    deleteVoucher,
    loadVouchers,
    saveVoucher,
    voucherRedemptions,
    voucherStatus,
} from '@/services/pos/vouchers.js'

export default {
    name: 'POSVouchers',
    components: {
        PosTopbar,
        VoucherEditorModal,
        VoucherPrintModal,
    },
    data() {
        const catalog = loadMenuCatalog()
        return {
            vouchers: [],
            query: '',
            filters: [
                'All',
                'Active',
                'Scheduled',
                'Expired',
                'Disabled',
            ],
            activeFilter: 'All',
            showEditor: false,
            editorVoucher: null,
            formError: '',
            copyFeedback: '',
            copyFeedbackTimer: null,
            printVoucher: null,
            services: ['Dine In', 'Takeaway'],
            categories: catalog.categories || [],
            menuProducts: catalog.products || [],
            days: [
                { value: 1, label: 'Mon' },
                { value: 2, label: 'Tue' },
                { value: 3, label: 'Wed' },
                { value: 4, label: 'Thu' },
                { value: 5, label: 'Fri' },
                { value: 6, label: 'Sat' },
                { value: 0, label: 'Sun' },
            ],
        }
    },
    computed: {
        emptyStateTitle() {
            return this.activeFilter === 'All'
                ? 'No vouchers found'
                : `No ${this.activeFilter.toLowerCase()} vouchers`
        },
        emptyStateMessage() {
            return this.activeFilter === 'All'
                ? 'Create a voucher to start a new discount campaign.'
                : `There are currently no vouchers with ${this.activeFilter.toLowerCase()} status.`
        },
        filteredVouchers() {
            const keyword = this.query.toLowerCase()
            return this.vouchers.filter((voucher) => {
                const filterMatch =
                    this.activeFilter === 'All' ||
                    voucherStatus(voucher) === this.activeFilter
                const keywordMatch =
                    !keyword ||
                    [voucher.name, voucher.code].some((value) =>
                        value.toLowerCase().includes(keyword),
                    )
                return filterMatch && keywordMatch
            })
        },
    },
    mounted() {
        this.refreshVouchers()
    },
    beforeUnmount() {
        if (this.copyFeedbackTimer) clearTimeout(this.copyFeedbackTimer)
    },
    methods: {
        voucherStatus,
        refreshVouchers() {
            this.vouchers = loadVouchers()
        },
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        statusCount(filter) {
            return filter === 'All'
                ? this.vouchers.length
                : this.vouchers.filter(
                      (voucher) => voucherStatus(voucher) === filter,
                  ).length
        },
        statusClass(voucher) {
            return voucherStatus(voucher).toLowerCase().replace(' ', '-')
        },
        discountLabel(voucher) {
            return voucher.type === 'percentage'
                ? `${this.compactNumber(voucher.value)}%`
                : `RM${this.compactNumber(voucher.value)}`
        },
        compactNumber(value) {
            const amount = Number(value || 0)
            return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
        },
        shortDate(value) {
            if (!value) return ''
            const date = new Date(`${value}T00:00:00`)
            if (Number.isNaN(date.getTime())) return value
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
            })
        },
        usageCount(voucher) {
            return voucherRedemptions(voucher.id).length
        },
        openCreate() {
            this.editorVoucher = null
            this.formError = ''
            this.showEditor = true
        },
        openEdit(voucher) {
            this.editorVoucher = voucher
            this.formError = ''
            this.showEditor = true
        },
        openVoucherPrint(voucher) {
            this.printVoucher = voucher
        },
        closeVoucherPrint() {
            this.printVoucher = null
        },
        closeEditor() {
            this.showEditor = false
            this.editorVoucher = null
            this.formError = ''
        },
        submitVoucher(voucher) {
            try {
                saveVoucher(voucher)
                this.refreshVouchers()
                this.closeEditor()
            } catch (error) {
                this.formError = error.message
            }
        },
        removeVoucher(voucherId) {
            deleteVoucher(voucherId)
            this.refreshVouchers()
            this.closeEditor()
        },
        async copyCode(code) {
            try {
                await navigator.clipboard.writeText(code)
                this.showCopyFeedback(`${code} copied`)
            } catch (error) {
                this.showCopyFeedback('Copy failed. Please copy the code manually.')
            }
        },
        showCopyFeedback(message) {
            this.copyFeedback = message
            if (this.copyFeedbackTimer) clearTimeout(this.copyFeedbackTimer)
            this.copyFeedbackTimer = setTimeout(() => {
                this.copyFeedback = ''
                this.copyFeedbackTimer = null
            }, 2200)
        },
    },
}
</script>
