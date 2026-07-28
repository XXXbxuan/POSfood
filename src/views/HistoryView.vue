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

        <section class="filter-bar history-filters">
            <label class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input v-model.trim="search" type="search" placeholder="Search product, movement or reference" /></label>
            <select v-model="type"><option value="">All movements</option><option>Stock In</option><option>Stock Out</option></select>
            <select v-model="staff"><option value="">All staff</option><option v-for="item in staffNames" :key="item">{{ item }}</option></select>
            <input v-model="date" type="date" aria-label="Filter by date" />
            <button v-if="hasFilters" class="button subtle" type="button" @click="clearFilters">Clear</button>
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
    },
    methods: {
        clearFilters() {
            this.search = ''
            this.type = ''
            this.staff = ''
            this.date = ''
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
