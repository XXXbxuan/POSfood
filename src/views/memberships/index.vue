<template>
    <main class="restro-page membership-page">
        <section class="restro-shell membership-shell">
            <PosTopbar>
                <template #actions>
                    <button
                        type="button"
                        class="module-primary-action"
                        @click="openCreate"
                    >
                        <i class="fa-solid fa-plus"></i>Add member
                    </button>
                </template>
            </PosTopbar>

            <section class="module-page-content">
                <header class="module-heading">
                    <div>
                        <h2>Membership</h2>
                    </div>
                    <label class="module-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input
                            v-model.trim="query"
                            type="search"
                            placeholder="Name, phone or Member ID"
                        />
                    </label>
                </header>

                <div class="member-workspace">
                    <section class="member-list-card">
                        <nav class="module-filter-tabs">
                            <button
                                v-for="filter in filters"
                                :key="filter"
                                type="button"
                                :class="{ active: activeFilter === filter }"
                                @click="activeFilter = filter"
                            >
                                {{ filter }}
                            </button>
                        </nav>
                        <div class="member-list-scroll">
                            <button
                                v-for="member in filteredMembers"
                                :key="member.id"
                                type="button"
                                class="member-list-row"
                                :class="{
                                    active: selectedMember?.id === member.id,
                                    inactive: member.status === 'inactive',
                                }"
                                @click="selectedId = member.id"
                            >
                                <span class="member-avatar">{{
                                    initials(member.name)
                                }}</span>
                                <span class="member-list-copy">
                                    <strong>{{ member.name }}</strong>
                                    <small
                                        >{{ member.memberId }} ·
                                        {{ member.phone }}</small
                                    >
                                </span>
                                <span class="member-points"
                                    >{{ member.points }} pts</span
                                >
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                            <div
                                v-if="!filteredMembers.length"
                                class="module-empty-state"
                            >
                                <i class="fa-solid fa-address-card"></i>
                                <strong>No members found</strong>
                                <small
                                    >Add a customer or change your
                                    search.</small
                                >
                            </div>
                        </div>
                    </section>

                    <section v-if="selectedMember" class="member-detail-card">
                        <header>
                            <div class="member-profile-title">
                                <span class="member-avatar large">{{
                                    initials(selectedMember.name)
                                }}</span>
                                <div class="member-identity-card">
                                    <div>
                                        <h3>{{ selectedMember.name }}</h3>
                                        <small>{{ selectedMember.memberId }}</small>
                                    </div>
                                    <div class="member-profile-points">
                                        <span>Points</span>
                                        <strong>{{ selectedMember.points }}</strong>
                                    </div>
                                </div>
                            </div>
                            <div class="member-profile-actions">
                                <button
                                    type="button"
                                    class="module-icon-button"
                                    @click="openEdit"
                                >
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                            </div>
                        </header>
                        <div class="member-detail-stats">
                            <article>
                                <span>Total spent</span
                                ><strong
                                    >RM
                                    {{
                                        money(selectedMember.totalSpent)
                                    }}</strong
                                >
                            </article>
                            <button
                                type="button"
                                class="member-order-summary"
                                @click="showOrderHistory = true"
                            >
                                <span>Orders</span
                                ><strong>{{
                                    selectedMember.totalOrders
                                }}</strong>
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                        <button
                            type="button"
                            class="member-voucher-summary"
                            @click="showVoucherList = true"
                        >
                            <span>Owned vouchers</span>
                            <strong>{{ memberVouchers.length }}</strong>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <dl class="member-contact-grid">
                            <div>
                                <dt>
                                    <i class="fa-solid fa-phone"></i>Phone
                                </dt>
                                <dd>{{ selectedMember.phone }}</dd>
                            </div>
                            <div>
                                <dt>
                                    <i class="fa-solid fa-envelope"></i>Email
                                </dt>
                                <dd>
                                    {{ selectedMember.email || 'Not provided' }}
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    <i class="fa-solid fa-cake-candles"></i
                                    >Birthday
                                </dt>
                                <dd>
                                    {{
                                        selectedMember.birthday ||
                                        'Not provided'
                                    }}
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    <i class="fa-solid fa-note-sticky"></i>Note
                                </dt>
                                <dd>{{ selectedMember.note || 'No note' }}</dd>
                            </div>
                        </dl>
                        <button
                            type="button"
                            class="member-status-button"
                            :class="{
                                activate: selectedMember.status === 'inactive',
                            }"
                            @click="showStatusConfirm = true"
                        >
                            {{
                                selectedMember.status === 'active'
                                    ? 'Deactivate member'
                                    : 'Activate member'
                            }}
                        </button>
                    </section>
                    <section v-else class="member-detail-card empty-detail">
                        <i class="fa-solid fa-user-group"></i>
                        <strong>Select a member</strong>
                        <small
                            >Customer details and order history appear
                            here.</small
                        >
                    </section>
                </div>
            </section>
        </section>

        <div
            v-if="showEditor"
            class="module-modal-backdrop"
            @click.self="closeEditor"
        >
            <section class="module-editor-modal member-editor-modal">
                <header>
                    <div>
                        <span>MEMBERSHIP</span>
                        <h2>{{ form.id ? 'Edit member' : 'Add member' }}</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        @click="closeEditor"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <form @submit.prevent="submitMember">
                    <MemberFormFields
                        v-model="form"
                        :show-points="Boolean(form.id)"
                    />
                    <p v-if="formError" class="module-form-error">
                        {{ formError }}
                    </p>
                    <footer>
                        <button
                            type="button"
                            class="module-secondary-action"
                            @click="closeEditor"
                        >
                            Cancel
                        </button>
                        <button type="submit" class="module-primary-action">
                            Save member
                        </button>
                    </footer>
                </form>
            </section>
        </div>

        <div
            v-if="showOrderHistory && selectedMember"
            class="module-modal-backdrop"
            @click.self="showOrderHistory = false"
        >
            <section class="member-orders-modal">
                <header>
                    <div>
                        <span>ORDERS</span>
                        <h2>{{ selectedMember.name }}</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close order history"
                        @click="showOrderHistory = false"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="member-orders-list">
                    <article v-for="sale in memberSales" :key="sale.id">
                        <div>
                            <strong>{{ sale.orderNumber }}</strong>
                            <small>{{ dateTime(sale.paidAt) }}</small>
                        </div>
                        <b>RM {{ money(sale.total) }}</b>
                    </article>
                    <div v-if="!memberSales.length" class="member-history-empty">
                        No paid orders yet.
                    </div>
                </div>
            </section>
        </div>

        <div
            v-if="showVoucherList && selectedMember"
            class="module-modal-backdrop"
            @click.self="showVoucherList = false"
        >
            <section class="member-voucher-list-modal">
                <header>
                    <div>
                        <span>OWNED VOUCHERS</span>
                        <h2>{{ selectedMember.name }}</h2>
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
                        v-for="voucher in memberVouchers"
                        :key="voucher.id"
                        type="button"
                        @click="selectedVoucher = voucher"
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
                        <em>{{ voucherOffer(voucher) }}</em>
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                    <p v-if="!memberVouchers.length">
                        No member vouchers available.
                    </p>
                </div>
            </section>
        </div>

        <div
            v-if="showStatusConfirm && selectedMember"
            class="module-modal-backdrop"
            @click.self="showStatusConfirm = false"
        >
            <section class="member-status-confirm-modal">
                <span class="member-status-confirm-icon">
                    <i
                        class="fa-solid"
                        :class="
                            selectedMember.status === 'active'
                                ? 'fa-user-slash'
                                : 'fa-user-check'
                        "
                    ></i>
                </span>
                <h2>
                    {{
                        selectedMember.status === 'active'
                            ? 'Deactivate member?'
                            : 'Activate member?'
                    }}
                </h2>
                <p>
                    {{ selectedMember.name }} will be
                    {{
                        selectedMember.status === 'active'
                            ? 'unable to use member benefits.'
                            : 'able to use member benefits again.'
                    }}
                </p>
                <footer>
                    <button
                        type="button"
                        class="module-secondary-action"
                        @click="showStatusConfirm = false"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="module-primary-action"
                        @click="confirmStatusChange"
                    >
                        Confirm
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="false && selectedVoucher"
            class="module-modal-backdrop"
            @click.self="selectedVoucher = null"
        >
            <section class="member-voucher-preview-modal">
                <button
                    type="button"
                    class="member-voucher-preview-close"
                    aria-label="Close voucher"
                    @click="selectedVoucher = null"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <article class="voucher-card member-voucher-preview-card">
                    <strong class="voucher-discount-corner">
                        {{ voucherOffer(selectedVoucher) }}
                    </strong>
                    <header>
                        <span class="voucher-code">
                            <strong>{{ selectedVoucher.code }}</strong>
                        </span>
                    </header>
                    <span
                        class="voucher-status"
                        :class="voucherStatusClass(selectedVoucher)"
                    >
                        {{ voucherStatus(selectedVoucher) }}
                    </span>
                    <dl>
                        <div>
                            <dt>Minimum spend</dt>
                            <dd>RM {{ money(selectedVoucher.minSpend) }}</dd>
                        </div>
                        <div>
                            <dt>Service</dt>
                            <dd class="voucher-service-tags">
                                <span
                                    v-for="service in selectedVoucher.serviceTypes"
                                    :key="service"
                                >
                                    {{ service }}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt>Validity</dt>
                            <dd>{{ voucherValidity(selectedVoucher) }}</dd>
                        </div>
                        <div>
                            <dt>Time</dt>
                            <dd>{{ voucherTime(selectedVoucher) }}</dd>
                        </div>
                    </dl>
                    <footer>
                        <span class="voucher-usage-stat">
                            <i class="fa-solid fa-users"></i>
                            {{ voucherUsage(selectedVoucher) }} /
                            {{ selectedVoucher.totalLimit || '∞' }} used
                        </span>
                        <span class="voucher-usage-stat">
                            <i class="fa-solid fa-user"></i>
                            {{
                                selectedVoucher.perMemberLimit
                                    ? `MAX : ${selectedVoucher.perMemberLimit}`
                                    : 'No limit'
                            }}
                        </span>
                    </footer>
                </article>
            </section>
        </div>

        <VoucherPrintModal
            v-if="selectedVoucher"
            :voucher="selectedVoucher"
            @close="selectedVoucher = null"
        />
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import MemberFormFields from '@/components/membership/MemberFormFields.vue'
import VoucherPrintModal from '@/components/voucher/VoucherPrintModal.vue'
import {
    loadMembers,
    saveMember,
    setMemberStatus,
} from '@/services/pos/memberships.js'
import { readList } from '@/services/pos/storage.js'
import {
    loadVouchers,
    voucherRedemptions,
    voucherStatus,
} from '@/services/pos/vouchers.js'

function emptyMemberForm() {
    return {
        id: '',
        name: '',
        phone: '',
        email: '',
        birthday: '',
        note: '',
        points: 0,
    }
}

export default {
    name: 'POSMemberships',
    components: { MemberFormFields, PosTopbar, VoucherPrintModal },
    data() {
        return {
            members: [],
            vouchers: [],
            query: '',
            filters: ['All', 'Active', 'Inactive'],
            activeFilter: 'All',
            selectedId: '',
            showEditor: false,
            showOrderHistory: false,
            showStatusConfirm: false,
            showVoucherList: false,
            selectedVoucher: null,
            form: emptyMemberForm(),
            formError: '',
        }
    },
    computed: {
        filteredMembers() {
            const keyword = this.query.toLowerCase()
            return this.members.filter((member) => {
                const statusMatch =
                    this.activeFilter === 'All' ||
                    member.status === this.activeFilter.toLowerCase()
                const keywordMatch =
                    !keyword ||
                    [member.name, member.phone, member.memberId].some((value) =>
                        String(value).toLowerCase().includes(keyword),
                    )
                return statusMatch && keywordMatch
            })
        },
        selectedMember() {
            return (
                this.members.find((member) => member.id === this.selectedId) ||
                null
            )
        },
        memberSales() {
            if (!this.selectedMember) return []
            return readList('posfood_sales').filter(
                (sale) => sale.member?.id === this.selectedMember.id,
            )
        },
        memberVouchers() {
            if (!this.selectedMember) return []
            return this.vouchers.filter(
                (voucher) =>
                    voucher.memberOnly && voucherStatus(voucher) === 'Active',
            )
        },
    },
    mounted() {
        this.vouchers = loadVouchers()
        this.refreshMembers(this.$route.query.member || '')
    },
    methods: {
        refreshMembers(selectedId = this.selectedId) {
            this.members = loadMembers()
            this.selectedId = this.members.some(
                (member) => member.id === selectedId,
            )
                ? selectedId
                : this.members[0]?.id || ''
        },
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        voucherOffer(voucher) {
            const value = Number(voucher.value || 0)
            return voucher.type === 'percentage'
                ? `${value}%`
                : `RM${value}`
        },
        voucherStatus,
        voucherStatusClass(voucher) {
            return voucherStatus(voucher).toLowerCase().replace(' ', '-')
        },
        voucherUsage(voucher) {
            return voucherRedemptions(voucher.id).length
        },
        voucherShortDate(value) {
            if (!value) return ''
            return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
            })
        },
        voucherValidity(voucher) {
            if (!voucher.startDate && !voucher.endDate) return '–'
            return `${this.voucherShortDate(voucher.startDate) || 'Now'} – ${
                this.voucherShortDate(voucher.endDate) || 'No expiry'
            }`
        },
        voucherTime(voucher) {
            return voucher.startTime && voucher.endTime
                ? `${voucher.startTime} – ${voucher.endTime}`
                : '–'
        },
        dateTime(value) {
            return value
                ? new Date(value).toLocaleString('en-MY', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                  })
                : ''
        },
        initials(name) {
            return String(name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
        openCreate() {
            this.form = emptyMemberForm()
            this.formError = ''
            this.showEditor = true
        },
        openEdit() {
            this.form = { ...this.selectedMember }
            this.formError = ''
            this.showEditor = true
        },
        closeEditor() {
            this.showEditor = false
            this.formError = ''
        },
        submitMember() {
            try {
                const member = saveMember(this.form)
                this.refreshMembers(member.id)
                this.closeEditor()
            } catch (error) {
                this.formError = error.message
            }
        },
        toggleStatus() {
            const status =
                this.selectedMember.status === 'active' ? 'inactive' : 'active'
            setMemberStatus(this.selectedMember.id, status)
            this.refreshMembers(this.selectedMember.id)
        },
        confirmStatusChange() {
            this.toggleStatus()
            this.showStatusConfirm = false
        },
    },
}
</script>
