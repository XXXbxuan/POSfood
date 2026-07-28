<template>
    <div class="page-stack history-page">
        <section class="page-heading">
            <div><h1>Stock History</h1></div>
        </section>

        <section class="history-summary">
            <article><span class="stock-in"><i class="fa-solid fa-arrow-down"></i></span><div><small>Total Stock In</small><strong>+{{ totals.stockIn }}</strong></div></article>
            <article><span class="stock-out"><i class="fa-solid fa-arrow-up"></i></span><div><small>Total Stock Out</small><strong>-{{ totals.stockOut }}</strong></div></article>
            <article><span class="neutral"><i class="fa-solid fa-list-check"></i></span><div><small>Movements</small><strong>{{ filteredMovements.length }}</strong></div></article>
            <article class="history-action-card">
                <button type="button" @click="print"><i class="fa-solid fa-print"></i>Print</button>
                <button type="button" @click="openFilters"><i class="fa-solid fa-sliders"></i>Filter<span v-if="activeFilterCount">{{ activeFilterCount }}</span></button>
            </article>
        </section>

        <section class="panel table-panel history-table-panel">
            <div class="table-scroll">
                <table class="inventory-table history-table history-table-summary">
                    <thead><tr><th>Movement</th><th>Product</th><th>Change</th><th>Date & Time</th><th aria-label="Details"></th></tr></thead>
                    <tbody>
                        <tr
                            v-for="item in filteredMovements"
                            :key="item.id"
                            class="history-clickable-row"
                            tabindex="0"
                            @click="openMovement(item)"
                            @keydown.enter.prevent="openMovement(item)"
                            @keydown.space.prevent="openMovement(item)"
                        >
                            <td><span class="movement-type" :class="item.changedQuantity > 0 ? 'in' : 'out'"><i class="fa-solid" :class="item.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'"></i>{{ item.type }}</span></td>
                            <td><strong>{{ item.productName }}</strong></td>
                            <td><strong class="change-quantity" :class="item.changedQuantity > 0 ? 'positive' : 'negative'">{{ item.changedQuantity > 0 ? '+' : '' }}{{ item.changedQuantity }}</strong></td>
                            <td><strong>{{ formattedDate(item.createdAt) }}</strong><small>{{ formattedTime(item.createdAt) }}</small></td>
                            <td class="history-row-arrow"><i class="fa-solid fa-chevron-right"></i></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!filteredMovements.length" class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><strong>No movements found</strong><p>Change the filters to see more records.</p></div>
        </section>

        <div v-if="selectedMovement" class="modal-backdrop" @click.self="selectedMovement = null">
            <section class="form-modal history-detail-modal">
                <header class="modal-header">
                    <div><h2>{{ selectedMovement.productName }}</h2><p class="mono">{{ selectedMovement.id }}</p></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="selectedMovement = null"><i class="fa-solid fa-xmark"></i></button>
                </header>

                <div class="history-detail-overview">
                    <span class="movement-type" :class="selectedMovement.changedQuantity > 0 ? 'in' : 'out'"><i class="fa-solid" :class="selectedMovement.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'"></i>{{ selectedMovement.type }}</span>
                    <strong class="history-detail-change" :class="selectedMovement.changedQuantity > 0 ? 'positive' : 'negative'">{{ selectedMovement.changedQuantity > 0 ? '+' : '' }}{{ selectedMovement.changedQuantity }}</strong>
                    <div><strong>{{ formattedDate(selectedMovement.createdAt) }}</strong><small>{{ formattedTime(selectedMovement.createdAt) }}</small></div>
                </div>

                <dl class="history-detail-grid">
                    <div><dt>Product Code</dt><dd class="mono">{{ selectedMovement.sku }}</dd></div>
                    <div><dt>Batch</dt><dd class="mono">{{ selectedMovement.batch || '—' }}</dd></div>
                    <div><dt>Before Stock</dt><dd>{{ selectedMovement.beforeQuantity }}</dd></div>
                    <div><dt>After Stock</dt><dd>{{ selectedMovement.afterQuantity }}</dd></div>
                    <div><dt>Reason</dt><dd>{{ selectedMovement.reason }}</dd></div>
                    <div><dt>Location</dt><dd>{{ selectedMovement.location || '—' }}</dd></div>
                    <div><dt>Operator</dt><dd>{{ selectedMovement.staffName }}</dd></div>
                    <div><dt>Staff ID</dt><dd class="mono">{{ selectedMovement.staffId }}</dd></div>
                    <div class="full"><dt>Reference</dt><dd class="mono">{{ selectedMovement.reference || '—' }}</dd></div>
                </dl>

                <footer class="history-detail-actions">
                    <button class="button primary" type="button" @click="selectedMovement = null">Done</button>
                </footer>
            </section>
        </div>

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
            selectedMovement: null,
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
        activeFilterCount() {
            return [this.search, this.type, this.staff, this.date].filter(Boolean).length
        },
    },
    methods: {
        openMovement(item) {
            this.selectedMovement = item
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
