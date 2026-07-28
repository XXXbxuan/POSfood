<template>
    <div class="page-stack history-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">AUDIT TRAIL</span>
                <h1>Stock History</h1>
                <p>Every stock change, operator and quantity in one record.</p>
            </div>
            <button class="button secondary" type="button" @click="print"><i class="fa-solid fa-print"></i>Print</button>
        </section>

        <section class="history-summary">
            <article><span class="stock-in"><i class="fa-solid fa-arrow-down"></i></span><div><small>Total Stock In</small><strong>+{{ totals.stockIn }}</strong></div></article>
            <article><span class="stock-out"><i class="fa-solid fa-arrow-up"></i></span><div><small>Total Stock Out</small><strong>-{{ totals.stockOut }}</strong></div></article>
            <article><span class="neutral"><i class="fa-solid fa-list-check"></i></span><div><small>Movements</small><strong>{{ filteredMovements.length }}</strong></div></article>
        </section>

        <section class="history-filter-trigger">
            <button class="button secondary" type="button" @click="openFilters">
                <i class="fa-solid fa-sliders"></i>Filter
                <span v-if="activeFilterCount">{{ activeFilterCount }}</span>
            </button>
        </section>

        <section class="panel table-panel history-table-panel">
            <div class="table-scroll">
                <table class="inventory-table history-table">
                    <thead><tr><th>Movement</th><th>Product</th><th>Change</th><th>Reason</th><th>Operator</th><th>Date & Time</th></tr></thead>
                    <tbody>
                        <tr v-for="item in filteredMovements" :key="item.id">
                            <td><span class="movement-type" :class="item.changedQuantity > 0 ? 'in' : 'out'"><i class="fa-solid" :class="item.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'"></i>{{ item.type }}</span><small class="mono">{{ item.id }}</small></td>
                            <td><strong>{{ item.productName }}</strong><small class="mono">{{ item.sku }}<template v-if="item.batch"> · {{ item.batch }}</template></small></td>
                            <td><strong class="change-quantity" :class="item.changedQuantity > 0 ? 'positive' : 'negative'">{{ item.changedQuantity > 0 ? '+' : '' }}{{ item.changedQuantity }}</strong><small>{{ item.beforeQuantity }} → {{ item.afterQuantity }}</small></td>
                            <td><strong>{{ item.reason }}</strong><small>{{ item.location }}</small></td>
                            <td><strong>{{ item.staffName }}</strong><small class="mono">{{ item.staffId }}</small></td>
                            <td><strong>{{ formattedDate(item.createdAt) }}</strong><small>{{ formattedTime(item.createdAt) }}</small></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!filteredMovements.length" class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><strong>No movements found</strong><p>Change the filters to see more records.</p></div>
        </section>

        <div v-if="filterOpen" class="modal-backdrop" @click.self="filterOpen = false">
            <section class="form-modal history-filter-modal">
                <header class="modal-header">
                    <div><span class="eyebrow">STOCK HISTORY</span><h2>Filter records</h2><p>Choose only what you need.</p></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="filterOpen = false"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <form class="form-grid two-column" @submit.prevent="applyFilters">
                    <label class="full"><span>Search</span><input v-model.trim="filterDraft.search" type="search" autofocus placeholder="Product, movement or reference" /></label>
                    <label><span>Movement</span><select v-model="filterDraft.type"><option value="">All movements</option><option>Stock In</option><option>Stock Out</option></select></label>
                    <label><span>Staff</span><select v-model="filterDraft.staff"><option value="">All staff</option><option v-for="item in staffNames" :key="item">{{ item }}</option></select></label>
                    <label class="full"><span>Date</span><input v-model="filterDraft.date" type="date" /></label>
                    <footer class="history-filter-actions full">
                        <button class="button secondary" type="button" @click="clearDraft">Clear</button>
                        <span></span>
                        <button class="button primary" type="submit">Apply Filter</button>
                    </footer>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'HistoryView',
    data() {
        return {
            store: inventoryStore,
            search: this.$route.query.product || '',
            type: '',
            staff: '',
            date: '',
            filterOpen: false,
            filterDraft: { search: '', type: '', staff: '', date: '' },
        }
    },
    computed: {
        staffNames() {
            return [...new Set(this.store.state.movements.map((item) => item.staffName))].sort()
        },
        filteredMovements() {
            const search = this.search.toLowerCase()
            return this.store.state.movements.filter((item) => {
                const matchesSearch =
                    !search ||
                    [item.productName, item.sku, item.id, item.reference, item.batch].some((value) =>
                        String(value || '').toLowerCase().includes(search),
                    )
                return matchesSearch && (!this.type || item.type === this.type) && (!this.staff || item.staffName === this.staff) && (!this.date || item.createdAt.startsWith(this.date))
            })
        },
        totals() {
            return {
                stockIn: this.filteredMovements.filter((item) => item.changedQuantity > 0).reduce((sum, item) => sum + item.changedQuantity, 0),
                stockOut: Math.abs(this.filteredMovements.filter((item) => item.changedQuantity < 0).reduce((sum, item) => sum + item.changedQuantity, 0)),
            }
        },
        hasFilters() {
            return Boolean(this.search || this.type || this.staff || this.date)
        },
        activeFilterCount() {
            return [this.search, this.type, this.staff, this.date].filter(Boolean).length
        },
    },
    methods: {
        clearFilters() {
            this.search = ''
            this.type = ''
            this.staff = ''
            this.date = ''
        },
        openFilters() {
            this.filterDraft = {
                search: this.search,
                type: this.type,
                staff: this.staff,
                date: this.date,
            }
            this.filterOpen = true
        },
        clearDraft() {
            this.filterDraft = { search: '', type: '', staff: '', date: '' }
        },
        applyFilters() {
            this.search = this.filterDraft.search
            this.type = this.filterDraft.type
            this.staff = this.filterDraft.staff
            this.date = this.filterDraft.date
            this.filterOpen = false
        },
        formattedDate(value) {
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
        },
        formattedTime(value) {
            return new Intl.DateTimeFormat('en-MY', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
        },
        print() {
            window.print()
        },
    },
}
</script>
