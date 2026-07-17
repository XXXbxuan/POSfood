<template>
    <main class="restro-page dashboard-page">
        <section class="dashboard-shell">
            <PosTopbar :show-order-actions="false" />
            <PosSidebar active="Home" />

            <section class="dashboard-workspace">
                <section class="order-lane dine-lane">
                    <header class="minimal-lane-title">
                        <div class="lane-left-tools">
                            <button
                                type="button"
                                class="table-grid-button"
                                aria-label="Show all tables"
                                @click="openTableOverview"
                            >
                                <i class="fa-solid fa-table-cells-large"></i
                                ><span>Table</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            class="lane-title-zoom"
                            :disabled="!dineInCards.length"
                            @click="showDineZoom = true"
                        >
                            Dine In
                        </button>
                        <div class="dine-lane-tools">
                            <button
                                type="button"
                                class="lane-order-action dine-in-button"
                                @click="openTablePicker"
                            >
                                <i class="fa-solid fa-utensils"></i>Dine In</button
                            ><button
                                type="button"
                                class="lane-order-action takeaway-button"
                                @click="startTakeaway"
                            >
                                <i class="fa-solid fa-bag-shopping"></i>Takeaway
                            </button>
                        </div>
                    </header>
                    <p v-if="dineInCards.length" class="order-sort-hint">
                        <i class="fa-solid fa-grip"></i>
                        Hold an order for 1 second, then drag it to reorder.
                    </p>
                    <div
                        v-if="dineInCards.length"
                        class="lane-row-shell dine-zoom-target"
                        title="Tap the empty area to expand all Dine In orders"
                        @click.self="showDineZoom = true"
                    >
                        <div
                            ref="dineOrderGrid"
                            class="order-lane-row order-card-grid long-sort-enabled"
                            @click.self="showDineZoom = true"
                        >
                            <button
                                v-for="order in dineInCards"
                                :key="
                                    order.id ||
                                    `${order.orderNumber}-${order.splitLabel}`
                                "
                                type="button"
                                class="simple-order-card dine-card"
                                :data-sort-id="dashboardOrderKey(order)"
                                :aria-label="`${order.orderNumber || order.orderSetup?.orderNo}, hold for one second to move`"
                                @click="openDashboardCard(order)"
                            >
                                <span class="card-order-number">{{
                                    order.orderNumber ||
                                    order.orderSetup?.orderNo
                                }}</span
                                ><span
                                    v-if="isSplitOrder(order)"
                                    class="card-split-label"
                                    >Split</span
                                ><strong class="card-table-number">{{
                                    orderLocation(order)
                                }}</strong
                                ><strong class="card-total"
                                    >RM
                                    {{ orderTotal(order).toFixed(2) }}</strong
                                ><time class="card-updated-time"
                                    ><i class="fa-regular fa-clock"></i
                                    >{{ orderTime(order) }}</time
                                >
                            </button>
                        </div>
                    </div>
                    <button
                        v-else
                        type="button"
                        class="empty-lane"
                        @click="openTablePicker"
                    >
                        <i class="fa-solid fa-plus"></i>No Dine In orders —
                        choose a table
                    </button>
                </section>
            </section>
        </section>

        <div
            v-if="showTables"
            class="dashboard-backdrop"
            @click.self="showTables = false"
        >
            <div class="table-workspace-modal">
                <section class="table-picker-modal">
                    <header>
                        <div>
                            <span>DINE IN</span>
                            <h2>
                                {{
                                    tablePickerMode === 'overview'
                                        ? 'Tables'
                                        : 'Choose a table'
                                }}
                            </h2>
                        </div>
                        <div class="table-picker-header-actions">
                            <button
                                v-if="tablePickerMode === 'overview'"
                                type="button"
                                class="open-layout-designer-button"
                                @click="openTableDesigner"
                            >
                                <i class="fa-solid fa-pen-ruler"></i>
                                Design layout
                            </button>
                            <button
                                type="button"
                                class="round-close"
                                @click="showTables = false"
                            >
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </header>
                    <nav
                        v-if="tablePickerMode === 'new'"
                        class="seat-filter-switcher"
                    >
                        <button
                            type="button"
                            aria-label="Previous table size"
                            @click="cycleSeatFilter(-1)"
                        >
                            <i class="fa-solid fa-chevron-left"></i></button
                        ><button
                            v-for="filter in ['All', '4', '6']"
                            :key="filter"
                            type="button"
                            :class="{ active: tableSeatFilter === filter }"
                            @click="tableSeatFilter = filter"
                        >
                            {{
                                filter === 'All' ? 'All' : `${filter} Pax`
                            }}</button
                        ><button
                            type="button"
                            aria-label="Next table size"
                            @click="cycleSeatFilter(1)"
                        >
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </nav>
                    <nav v-else class="table-status-filters">
                        <button
                            v-for="filter in ['All', 'Available', 'Unpaid']"
                            :key="filter"
                            type="button"
                            :class="{ active: tableFilter === filter }"
                            @click="tableFilter = filter"
                        >
                            {{ filter }}
                        </button>
                    </nav>
                    <p
                        v-if="
                            tablePickerMode === 'overview' &&
                            tableFilter === 'All'
                        "
                        class="table-sort-hint"
                    >
                        <i class="fa-solid fa-grip"></i>
                        Hold a table for 1 second, then drag it to reorder.
                    </p>
                    <TableGrid
                        :tables="
                            tablePickerMode === 'overview'
                                ? filteredTables
                                : newOrderTables
                        "
                        :show-add="
                            tablePickerMode === 'overview' &&
                            tableFilter === 'All'
                        "
                        :sortable="
                            tablePickerMode === 'overview' &&
                            tableFilter === 'All'
                        "
                        @select="handleTableClick"
                        @add="requestAddTable"
                        @reorder="reorderTables"
                    />
                </section>
            </div>
        </div>

        <TableLayoutDesigner
            v-if="showTableDesigner"
            :tables="tables"
            @close="closeTableDesigner"
        />

        <div
            v-if="showTableActionMenu && managementTarget"
            class="table-confirm-layer"
            @click.self="resetTableAdmin"
        >
            <section class="table-action-menu" role="dialog" aria-modal="true">
                <header>
                    <span>TABLE</span>
                    <h3>{{ managementTarget.number }}</h3>
                </header>
                <button type="button" @click="requestTableAction('delete')">
                    <i class="fa-solid fa-trash-can"></i><strong>Delete</strong>
                </button>
                <button
                    type="button"
                    @click="
                        requestTableAction(
                            managementTarget.status === 'service'
                                ? 'unservice'
                                : 'service',
                        )
                    "
                >
                    <i
                        class="fa-solid"
                        :class="
                            managementTarget.status === 'service'
                                ? 'fa-circle-check'
                                : 'fa-screwdriver-wrench'
                        "
                    ></i
                    ><strong>{{
                        managementTarget.status === 'service'
                            ? 'Return to service'
                            : 'Service'
                    }}</strong>
                </button>
                <button
                    type="button"
                    class="table-action-cancel"
                    @click="resetTableAdmin"
                >
                    Cancel
                </button>
            </section>
        </div>

        <div
            v-if="tableAdminAction && managementTarget && !showTableActionMenu"
            class="table-confirm-layer"
            @click.self="resetTableAdmin"
        >
            <section
                class="table-confirm-modal"
                role="dialog"
                aria-modal="true"
            >
                <div class="table-confirm-icon">
                    <i
                        :class="
                            tableAdminAction === 'add'
                                ? 'fa-solid fa-plus'
                                : tableAdminAction === 'delete'
                                  ? 'fa-solid fa-trash-can'
                                  : tableAdminAction === 'unservice'
                                    ? 'fa-solid fa-circle-check'
                                    : 'fa-solid fa-screwdriver-wrench'
                        "
                    ></i>
                </div>
                <h3>
                    {{
                        tableAdminAction === 'add'
                            ? `Add ${managementTarget.number}?`
                            : tableAdminAction === 'delete'
                              ? `Delete ${managementTarget.number}?`
                              : tableAdminAction === 'unservice'
                                ? `Return ${managementTarget.number} to service?`
                                : `Service ${managementTarget.number}?`
                    }}
                </h3>
                <p>
                    {{
                        tableAdminAction === 'add'
                            ? `A new ${managementTarget.seats}-seat table will be added after the latest table.`
                            : tableAdminAction === 'delete'
                              ? 'This table will be removed from the layout.'
                              : tableAdminAction === 'unservice'
                                ? 'This table will become available for new orders.'
                                : 'This table will be marked unavailable for service.'
                    }}
                </p>
                <footer>
                    <button type="button" @click="resetTableAdmin">
                        Cancel</button
                    ><button
                        type="button"
                        :class="
                            tableAdminAction === 'delete'
                                ? 'confirm-danger'
                                : 'confirm-service'
                        "
                        @click="confirmTableAction"
                    >
                        Confirm
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="showDineZoom"
            class="dashboard-backdrop dine-zoom-backdrop"
            @click.self="showDineZoom = false"
        >
            <section class="dine-zoom-modal">
                <header>
                    <div>
                        <span>LIVE ORDERS</span>
                        <h2>Dine In</h2>
                        <small>{{ dineInCards.length }} active orders</small>
                    </div>
                    <button
                        type="button"
                        class="round-close"
                        @click="showDineZoom = false"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="dine-zoom-grid">
                    <button
                        v-for="order in dineInCards"
                        :key="`zoom-${order.id || order.orderNumber}`"
                        type="button"
                        class="simple-order-card dine-card"
                        @click="openZoomOrder(order)"
                    >
                        <span class="card-order-number">{{
                            order.orderNumber || order.orderSetup?.orderNo
                        }}</span
                        ><span
                            v-if="isSplitOrder(order)"
                            class="card-split-label"
                            >Split</span
                        ><strong class="card-table-number">{{
                            orderLocation(order)
                        }}</strong
                        ><strong class="card-total"
                            >RM {{ orderTotal(order).toFixed(2) }}</strong
                        ><time class="card-updated-time"
                            ><i class="fa-regular fa-clock"></i
                            >{{ orderTime(order) }}</time
                        >
                    </button>
                </div>
            </section>
        </div>

        <div v-if="tableToast" class="table-toast" role="status">
            <i class="fa-solid fa-circle-check"></i>{{ tableToast }}
        </div>

        <div
            v-if="tableOrderChoices.length"
            class="dashboard-backdrop"
            @click.self="tableOrderChoices = []"
        >
            <section class="table-bill-modal">
                <header>
                    <div>
                        <span>TABLE {{ selectedTableNumber }}</span>
                        <h2>Choose a bill</h2>
                    </div>
                    <button
                        type="button"
                        class="round-close"
                        @click="tableOrderChoices = []"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <button
                    v-for="order in tableOrderChoices"
                    :key="order.id"
                    type="button"
                    @click="openTableBill(order)"
                >
                    <div>
                        <strong>{{ order.orderNumber }}</strong
                        ><span
                            >{{ order.splitLabel || 'Order' }} ·
                            {{ itemCount(order) }} items</span
                        >
                    </div>
                    <b>RM {{ orderTotal(order).toFixed(2) }}</b
                    ><i class="fa-solid fa-chevron-right"></i>
                </button>
            </section>
        </div>

        <div
            v-if="selectedOrder"
            class="dashboard-backdrop"
            @click.self="closeOrder"
        >
            <section
                class="order-action-modal"
                :class="{ 'inline-split-mode': showSplit }"
            >
                <header>
                    <button
                        v-if="showSplit"
                        type="button"
                        class="split-back"
                        aria-label="Back to order"
                        @click="cancelSplit"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <span>{{
                            showSplit
                                ? 'SPLIT PAYMENT'
                                : (isTakeaway(selectedOrder)
                                      ? 'TAKEAWAY'
                                      : 'DINE IN') +
                                  ' · ' +
                                  orderLocation(selectedOrder)
                        }}</span>
                        <h2>
                            {{
                                selectedOrder.orderNumber ||
                                selectedOrder.orderSetup?.orderNo
                            }}
                            <small v-if="isSplitOrder(selectedOrder)"
                                >Split</small
                            >
                        </h2>
                    </div>
                    <button
                        type="button"
                        class="round-close"
                        @click="closeOrder"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div v-if="!showSplit" class="action-order-items">
                    <article
                        v-for="(item, index) in allItems(selectedOrder)"
                        :key="`${item.name}-${index}`"
                    >
                        <img :src="item.image" :alt="item.name" />
                        <div>
                            <strong>{{ item.name }}</strong
                            ><span>{{
                                item.size || item.optionLines?.[0] || 'Regular'
                            }}</span>
                        </div>
                        <b>{{ item.qty || 1 }}x</b
                        ><em>RM {{ itemLineTotal(item).toFixed(2) }}</em>
                    </article>
                </div>
                <div v-else class="inline-split-items">
                    <section
                        v-for="group in splitCandidateGroups"
                        :key="group.groupIndex"
                        class="split-selection-group"
                    >
                        <header>
                            <button
                                type="button"
                                :class="{
                                    selected: isSplitGroupSelected(group),
                                }"
                                @click="toggleSplitGroup(group)"
                            >
                                <span class="split-group-check"
                                    ><i class="fa-solid fa-check"></i></span
                                ><span>{{ group.displayLabel }}</span></button
                            ><strong
                                >{{ group.candidates.length }} items</strong
                            >
                        </header>
                        <label
                            v-for="candidate in group.candidates"
                            :key="candidate.key"
                            :class="{
                                selected: splitSelection.includes(
                                    candidate.key,
                                ),
                            }"
                            ><input
                                v-model="splitSelection"
                                type="checkbox"
                                :value="candidate.key"
                            /><span class="split-check-box"
                                ><i class="fa-solid fa-check"></i></span
                            ><img
                                :src="candidate.item.image"
                                :alt="candidate.item.name"
                            />
                            <div>
                                <strong>{{ candidate.item.name }}</strong
                                ><small>{{
                                    candidate.item.size || 'Regular'
                                }}</small>
                            </div>
                            <b
                                >RM
                                {{
                                    itemUnitTotal(candidate.item).toFixed(2)
                                }}</b
                            ></label
                        >
                    </section>
                </div>
                <p v-if="splitError" class="split-error">{{ splitError }}</p>
                <div class="action-total">
                    <span>{{
                        showSplit ? 'Selected amount' : 'Total payable'
                    }}</span
                    ><strong
                        >RM
                        {{
                            (showSplit
                                ? splitSelectedTotal
                                : orderTotal(selectedOrder)
                            ).toFixed(2)
                        }}</strong
                    >
                </div>
                <footer
                    v-if="!showSplit"
                    :class="{ 'without-split': splitCandidates.length < 2 }"
                >
                    <button
                        type="button"
                        class="edit-action"
                        @click="editOrder"
                    >
                        <i class="fa-regular fa-pen-to-square"></i
                        ><span>Edit</span></button
                    ><button
                        v-if="splitCandidates.length >= 2"
                        type="button"
                        class="split-action"
                        @click="beginSplit"
                    >
                        <i class="fa-solid fa-code-branch"></i
                        ><span>Split</span></button
                    ><button
                        type="button"
                        class="checkout-action"
                        @click="checkoutOrder"
                    >
                        <i class="fa-regular fa-credit-card"></i
                        ><span>Checkout</span>
                    </button>
                </footer>
                <footer v-else class="inline-split-footer">
                    <button
                        type="button"
                        class="checkout-action"
                        :disabled="!splitSelection.length"
                        @click="checkoutSplitSelection"
                    >
                        <i class="fa-regular fa-credit-card"></i
                        ><span>Checkout selected</span
                        ><strong>RM {{ splitSelectedTotal.toFixed(2) }}</strong>
                    </button>
                </footer>
            </section>
        </div>
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import PosSidebar from '@/components/common/PosSidebar.vue'
import TableGrid from '@/components/table/TableGrid.vue'
import TableLayoutDesigner from '@/components/table/TableLayoutDesigner.vue'
import { readList as readStoredList } from '@/services/pos/storage.js'
import {
    createLongPressSortable,
    moveListItem,
} from '@/utils/sortable.js'
export default {
    name: 'POSStart',
    components: { PosTopbar, PosSidebar, TableGrid, TableLayoutDesigner },
    data() {
        return {
            activeOrders: [],
            selectedOrder: null,
            tableOrderChoices: [],
            selectedTableNumber: '',
            showSplit: false,
            showTables: false,
            showTableDesigner: false,
            showDineZoom: false,
            tablePickerMode: 'new',
            tableFilter: 'All',
            tableSeatFilter: 'All',
            splitSelection: [],
            splitError: '',
            dineOrderSequence: [],
            dineOrderSortController: null,
            tableAdminAction: '',
            tableAdminError: '',
            managementTarget: null,
            showTableActionMenu: false,
            tableToast: '',
            tableToastTimer: null,
            tables: [
                { number: 'T21', status: 'vacant', seats: 4, guests: 0 },
                { number: 'T22', status: 'vacant', seats: 4, guests: 0 },
                { number: 'T23', status: 'vacant', seats: 4, guests: 0 },
                { number: 'T24', status: 'vacant', seats: 4, guests: 0 },
                { number: 'T25', status: 'vacant', seats: 4, guests: 0 },
                { number: 'T26', status: 'vacant', seats: 4, guests: 0 },
                { number: 'T41', status: 'vacant', seats: 6, guests: 0 },
                { number: 'T42', status: 'vacant', seats: 6, guests: 0 },
                { number: 'T43', status: 'vacant', seats: 6, guests: 0 },
                { number: 'T44', status: 'vacant', seats: 6, guests: 0 },
                { number: 'T45', status: 'vacant', seats: 6, guests: 0 },
                { number: 'T46', status: 'vacant', seats: 6, guests: 0 },
            ],
        }
    },
    computed: {
        dineInCount() {
            return this.activeOrders.filter((order) => !this.isTakeaway(order))
                .length
        },
        takeawayCount() {
            return this.activeOrders.filter((order) => this.isTakeaway(order))
                .length
        },
        dineInOrders() {
            return this.activeOrders.filter((order) => !this.isTakeaway(order))
        },
        takeawayOrders() {
            return this.activeOrders.filter((order) => this.isTakeaway(order))
        },
        dineInCards() {
            return this.applyDineOrderSequence(
                this.groupOrders(this.dineInOrders),
            )
        },
        takeawayCards() {
            return this.groupOrders(this.takeawayOrders)
        },
        dashboardCount() {
            return this.dineInCards.length + this.takeawayCards.length
        },
        availableTables() {
            return this.tables.filter((table) => table.status === 'vacant')
        },
        currentTables() {
            return this.tables.filter(
                (table) => table.status === 'served' || table.status === 'paid',
            )
        },
        filteredTables() {
            if (this.tableFilter === 'All') return this.tables
            const status = { Available: 'vacant', Unpaid: 'served' }[
                this.tableFilter
            ]
            return this.tables.filter((table) => table.status === status)
        },
        newOrderTables() {
            return this.availableTables.filter(
                (table) =>
                    this.tableSeatFilter === 'All' ||
                    String(table.seats) === this.tableSeatFilter,
            )
        },
        splitCandidates() {
            if (!this.selectedOrder) return []
            const groups = this.selectedOrder.orderGroups?.length
                ? this.selectedOrder.orderGroups
                : [{ label: 'Order', items: this.selectedOrder.items || [] }]
            const result = []
            groups.forEach((group, groupIndex) =>
                (group.items || []).forEach((item, itemIndex) => {
                    const qty = Math.max(1, Number(item.qty) || 1)
                    for (let unit = 0; unit < qty; unit += 1)
                        result.push({
                            key: `${groupIndex}-${itemIndex}-${unit}`,
                            groupIndex,
                            itemIndex,
                            groupLabel:
                                group.label || `Previous ${groupIndex + 1}`,
                            item: {
                                ...item,
                                qty: 1,
                                total: this.itemUnitTotal(item),
                            },
                        })
                }),
            )
            return result
        },
        splitCandidateGroups() {
            const groups = []
            this.splitCandidates.forEach((candidate) => {
                let group = groups.find(
                    (row) => row.groupIndex === candidate.groupIndex,
                )
                if (!group) {
                    const previousIndex = candidate.groupIndex
                    group = {
                        groupIndex: candidate.groupIndex,
                        displayLabel:
                            previousIndex === 0
                                ? 'Order'
                                : `Previous Order${previousIndex > 1 ? ` ${previousIndex}` : ''}`,
                        candidates: [],
                    }
                    groups.push(group)
                }
                group.candidates.push(candidate)
            })
            return groups
        },
        splitSelectedSubtotal() {
            const chosen = new Set(this.splitSelection)
            return this.splitCandidates
                .filter((row) => chosen.has(row.key))
                .reduce((sum, row) => sum + this.itemUnitTotal(row.item), 0)
        },
        splitSelectedTotal() {
            return (
                this.splitSelectedSubtotal *
                (1 + this.orderTaxRate(this.selectedOrder))
            )
        },
        nextTableNumber() {
            const numbers = this.tables.map((table) =>
                Number(String(table.number).match(/\d+/)?.[0] || 0),
            )
            return `T${Math.max(0, ...numbers) + 1}`
        },
        nextTableSeats() {
            const seats = Number(this.tables[this.tables.length - 1]?.seats)
            return [4, 6].includes(seats) ? seats : 4
        },
    },
    mounted() {
        if (!localStorage.getItem('posfood_active_account'))
            return this.$router.push('/')
        this.loadDashboard()
        this.$nextTick(this.setupDineOrderSorting)
        const reopenId = String(this.$route.query.reopen || '')
        if (reopenId) {
            const order = this.activeOrders.find(
                (item) =>
                    String(item.id) === reopenId ||
                    String(item.orderNumber) === reopenId,
            )
            if (order) this.openOrder(order)
        } else if (this.$route.query.new === 'dine-in') this.openTablePicker()
    },
    beforeUnmount() {
        this.dineOrderSortController?.destroy()
        this.dineOrderSortController = null
        clearTimeout(this.tableToastTimer)
    },
    methods: {
        readList(key) {
            return readStoredList(key)
        },
        readObject(key) {
            try {
                return JSON.parse(localStorage.getItem(key)) || {}
            } catch (error) {
                return {}
            }
        },
        loadTableConfiguration() {
            const stored = this.readList('posfood_tables')
            if (stored.length)
                this.tables = stored.map((table) => ({
                    number: String(table.number).toUpperCase(),
                    seats: Number(table.seats) || 4,
                    status: 'vacant',
                    guests: 0,
                }))
        },
        saveTableConfiguration() {
            localStorage.setItem(
                'posfood_tables',
                JSON.stringify(
                    this.tables.map((table) => ({
                        number: table.number,
                        seats: table.seats,
                    })),
                ),
            )
        },
        reorderTables({ oldIndex, newIndex }) {
            if (
                !Number.isInteger(oldIndex) ||
                !Number.isInteger(newIndex) ||
                oldIndex === newIndex ||
                oldIndex < 0 ||
                newIndex < 0 ||
                oldIndex >= this.tables.length ||
                newIndex >= this.tables.length
            ) {
                return
            }

            const movedTable = this.tables[oldIndex]
            const reorderedTables = moveListItem(
                this.tables,
                oldIndex,
                newIndex,
            )
            this.tables = reorderedTables
            this.saveTableConfiguration()
            this.showTableToast(`${movedTable.number} position was saved.`)
        },
        loadDashboard() {
            this.loadTableConfiguration()
            this.dineOrderSequence = this.readList(
                'posfood_dine_order_sequence',
            )
            const stored = this.readList('posfood_held_orders')
            const dineOnly = stored.filter((order) => !this.isTakeaway(order))
            if (dineOnly.length !== stored.length)
                localStorage.setItem(
                    'posfood_held_orders',
                    JSON.stringify(dineOnly),
                )
            this.activeOrders = dineOnly
                .slice()
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt || b.heldAt || b.createdAt || 0) -
                        new Date(a.updatedAt || a.heldAt || a.createdAt || 0),
                )
            this.hydrateTables()
        },
        setupDineOrderSorting() {
            this.dineOrderSortController?.destroy()
            this.dineOrderSortController = null

            if (!this.$refs.dineOrderGrid) return

            this.dineOrderSortController = createLongPressSortable(
                this.$refs.dineOrderGrid,
                {
                    draggable: '.simple-order-card',
                    onReorder: this.reorderDineOrders,
                },
            )
        },
        dashboardOrderKey(order) {
            return String(
                order.id ||
                    order.orderNumber ||
                    order.orderSetup?.orderNo ||
                    '',
            )
        },
        applyDineOrderSequence(cards) {
            const positions = new Map(
                this.dineOrderSequence.map((key, index) => [key, index]),
            )

            return cards.slice().sort((first, second) => {
                const firstPosition = positions.get(
                    this.dashboardOrderKey(first),
                )
                const secondPosition = positions.get(
                    this.dashboardOrderKey(second),
                )
                const firstSaved = Number.isInteger(firstPosition)
                const secondSaved = Number.isInteger(secondPosition)

                if (firstSaved && secondSaved)
                    return firstPosition - secondPosition
                if (firstSaved) return -1
                if (secondSaved) return 1
                return 0
            })
        },
        reorderDineOrders({ oldIndex, newIndex }) {
            const reorderedCards = moveListItem(
                this.dineInCards,
                oldIndex,
                newIndex,
            )
            this.dineOrderSequence = reorderedCards.map(
                this.dashboardOrderKey,
            )
            localStorage.setItem(
                'posfood_dine_order_sequence',
                JSON.stringify(this.dineOrderSequence),
            )
            this.showTableToast('Home order position was saved.')
        },
        hydrateTables() {
            const states = this.readObject('posfood_table_states')
            this.tables.forEach((table) => {
                table.status =
                    states[table.number]?.status === 'service'
                        ? 'service'
                        : 'vacant'
                table.guests = 0
                table.orders = []
                delete table.order
            })
            this.activeOrders.forEach((order) => {
                const number =
                    order.orderSetup?.tableNumber || order.tableNumber
                const table = this.tables.find((item) => item.number === number)
                if (table) {
                    table.status = 'served'
                    table.guests =
                        order.orderSetup?.pax || order.guests || table.seats
                    table.orders.push(order)
                    table.order = table.orders[0]
                }
            })
        },
        openTablePicker() {
            this.tablePickerMode = 'new'
            this.tableSeatFilter = 'All'
            this.loadDashboard()
            this.showTables = true
        },
        openTableOverview() {
            this.tablePickerMode = 'overview'
            this.tableFilter = 'All'
            this.resetTableAdmin()
            this.loadDashboard()
            this.showTables = true
        },
        openTableDesigner() {
            this.showTableDesigner = true
        },
        closeTableDesigner() {
            this.showTableDesigner = false
            this.loadDashboard()
        },
        resetTableAdmin() {
            this.tableAdminAction = ''
            this.tableAdminError = ''
            this.managementTarget = null
            this.showTableActionMenu = false
        },
        requestAddTable() {
            this.managementTarget = {
                number: this.nextTableNumber,
                seats: this.nextTableSeats,
                status: 'vacant',
                guests: 0,
                orders: [],
            }
            this.tableAdminAction = 'add'
            this.showTableActionMenu = false
        },
        requestTableAction(action) {
            const table = this.managementTarget
            if (!table) return
            if (table.status === 'served') {
                this.showTableToast(`${table.number} has an unpaid order.`)
                return
            }
            this.tableAdminAction = action
            this.showTableActionMenu = false
        },
        confirmTableAction() {
            const table = this.managementTarget
            if (!table) return
            if (this.tableAdminAction === 'add') {
                this.tables.push({ ...table })
                this.saveTableConfiguration()
                this.showTableToast(`${table.number} was added successfully.`)
                this.resetTableAdmin()
                return
            }
            if (table.status === 'served') {
                this.showTableToast(`${table.number} has an unpaid order.`)
                this.resetTableAdmin()
                return
            }
            const states = this.readObject('posfood_table_states')
            if (this.tableAdminAction === 'delete') {
                this.tables = this.tables.filter(
                    (item) => item.number !== table.number,
                )
                delete states[table.number]
                localStorage.setItem(
                    'posfood_table_states',
                    JSON.stringify(states),
                )
                this.saveTableConfiguration()
                this.showTableToast(`${table.number} was deleted.`)
            } else if (this.tableAdminAction === 'unservice') {
                delete states[table.number]
                localStorage.setItem(
                    'posfood_table_states',
                    JSON.stringify(states),
                )
                this.hydrateTables()
                this.showTableToast(`${table.number} is available again.`)
            } else {
                states[table.number] = {
                    status: 'service',
                    updatedAt: Date.now(),
                }
                localStorage.setItem(
                    'posfood_table_states',
                    JSON.stringify(states),
                )
                this.hydrateTables()
                this.showTableToast(`${table.number} is marked as service.`)
            }
            this.resetTableAdmin()
        },
        showTableToast(message) {
            this.tableToast = message
            clearTimeout(this.tableToastTimer)
            this.tableToastTimer = setTimeout(() => {
                this.tableToast = ''
            }, 3200)
        },
        cycleSeatFilter(direction) {
            const filters = ['All', '4', '6']
            const index = filters.indexOf(this.tableSeatFilter)
            this.tableSeatFilter =
                filters[(index + direction + filters.length) % filters.length]
        },
        handleTableClick(table) {
            if (this.tablePickerMode === 'overview') {
                this.managementTarget = table
                this.tableAdminAction = ''
                this.showTableActionMenu = true
                return
            }
            if (table.status === 'vacant') this.startTableOrder(table)
            else this.openTableOrder(table)
        },
        startTableOrder(table) {
            if (table.status !== 'vacant') return
            this.showTables = false
            const setup = {
                orderType: 'Dine In',
                tableNumber: table.number,
                pax: table.seats,
                orderNo: `#${String(Date.now()).slice(-5)}`,
            }
            localStorage.removeItem('posfood_order_draft')
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            localStorage.setItem('posfood_order_setup', JSON.stringify(setup))
            this.$router.push('/pos/order')
        },
        startTakeaway() {
            const setup = {
                orderType: 'Takeaway',
                tableNumber: '',
                pax: 1,
                orderNo: `#${String(Date.now()).slice(-5)}`,
            }
            localStorage.removeItem('posfood_order_draft')
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            localStorage.setItem('posfood_order_setup', JSON.stringify(setup))
            this.$router.push(`/pos/order?takeaway=${Date.now()}`)
        },
        openTableOrder(table) {
            this.showTables = false
            if (table.status === 'served' && table.orders?.length > 1) {
                this.selectedTableNumber = table.number
                this.tableOrderChoices = table.orders
                return
            }
            if (table.status === 'served' && table.order)
                this.openOrder(table.order)
            else if (table.status === 'paid' && table.order) {
                localStorage.setItem(
                    'posfood_last_receipt',
                    JSON.stringify(table.order),
                )
                this.$router.push(`/pos/receipt/${table.order.id}`)
            }
        },
        openTableBill(order) {
            this.tableOrderChoices = []
            this.openOrder(order)
        },
        groupOrders(orders) {
            const regular = []
            const splitBuckets = new Map()
            orders.forEach((order) => {
                if (
                    order.splitLabel ||
                    order.parentOrderId ||
                    order.splitSessionId
                ) {
                    const key = `${order.parentOrderId || order.splitSessionId || order.orderNumber}-${this.orderLocation(order)}`
                    if (!splitBuckets.has(key)) splitBuckets.set(key, [])
                    splitBuckets.get(key).push(order)
                } else regular.push(order)
            })
            const splitCards = [...splitBuckets.entries()].map(
                ([key, bills]) => {
                    const first = bills[0]
                    const items = bills.flatMap((bill) => this.allItems(bill))
                    const subtotal = bills.reduce((sum, bill) => {
                        const stored = Number(bill.subtotal || 0)
                        return (
                            sum +
                            (stored > 0
                                ? stored
                                : this.allItems(bill).reduce(
                                      (itemSum, item) =>
                                          itemSum + this.itemLineTotal(item),
                                      0,
                                  ))
                        )
                    }, 0)
                    const tax = bills.reduce((sum, bill) => {
                        const stored = Number(bill.tax || 0)
                        if (stored > 0) return sum + stored
                        const billSubtotal =
                            Number(bill.subtotal || 0) > 0
                                ? Number(bill.subtotal)
                                : this.allItems(bill).reduce(
                                      (itemSum, item) =>
                                          itemSum + this.itemLineTotal(item),
                                      0,
                                  )
                        return sum + billSubtotal * this.orderTaxRate(bill)
                    }, 0)
                    return {
                        ...first,
                        id: `SPLIT-${key}`,
                        __splitGroup: true,
                        orders: bills,
                        sourceOrderIds: bills
                            .map((bill) => bill.id)
                            .filter(Boolean),
                        splitLabel: 'Split',
                        items,
                        orderGroups: [],
                        subtotal,
                        tax,
                        total: subtotal + tax,
                        updatedAt: bills
                            .map(
                                (bill) =>
                                    bill.updatedAt ||
                                    bill.heldAt ||
                                    bill.createdAt,
                            )
                            .sort()
                            .reverse()[0],
                    }
                },
            )
            return [...splitCards, ...regular].sort(
                (a, b) =>
                    new Date(b.updatedAt || b.heldAt || b.createdAt || 0) -
                    new Date(a.updatedAt || a.heldAt || a.createdAt || 0),
            )
        },
        openDashboardCard(order) {
            if (this.dineOrderSortController?.shouldSuppressClick()) return
            this.openOrder(order)
        },
        openZoomOrder(order) {
            this.showDineZoom = false
            this.openDashboardCard(order)
        },
        openOrder(order) {
            this.tableOrderChoices = []
            this.selectedOrder = order
            this.showSplit = false
            this.splitSelection = []
            this.splitError = ''
        },
        closeOrder() {
            this.selectedOrder = null
            this.showSplit = false
        },
        editOrder() {
            const order = this.selectedOrder
            if (!order) return
            localStorage.removeItem('posfood_order_draft')
            localStorage.setItem('posfood_editing_order', JSON.stringify(order))
            localStorage.removeItem('posfood_add_order_mode')
            localStorage.setItem(
                'posfood_order_setup',
                JSON.stringify(order.orderSetup || {}),
            )
            this.$router.push('/pos/order')
        },
        checkoutOrder() {
            const order = this.selectedOrder
            if (!order) return
            localStorage.setItem('posfood_checkout', JSON.stringify(order))
            localStorage.setItem(
                'posfood_order_setup',
                JSON.stringify(order.orderSetup || {}),
            )
            this.$router.push('/pos/checkout')
        },
        beginSplit() {
            this.splitSelection = []
            this.splitError = ''
            this.showSplit = true
        },
        cancelSplit() {
            this.showSplit = false
            this.splitSelection = []
            this.splitError = ''
        },
        isSplitGroupSelected(group) {
            return (
                group.candidates.length > 0 &&
                group.candidates.every((candidate) =>
                    this.splitSelection.includes(candidate.key),
                )
            )
        },
        toggleSplitGroup(group) {
            const selected = new Set(this.splitSelection)
            const selectGroup = !this.isSplitGroupSelected(group)
            group.candidates.forEach((candidate) =>
                selectGroup
                    ? selected.add(candidate.key)
                    : selected.delete(candidate.key),
            )
            this.splitSelection = [...selected]
            this.splitError = ''
        },
        splitGroups(selected) {
            const chosen = new Set(this.splitSelection)
            const rows = this.splitCandidates.filter(
                (row) => chosen.has(row.key) === selected,
            )
            const groups = []
            rows.forEach((row) => {
                let group = groups.find(
                    (item2) => item2.groupIndex === row.groupIndex,
                )
                if (!group) {
                    group = {
                        groupIndex: row.groupIndex,
                        label: row.groupLabel,
                        items: [],
                    }
                    groups.push(group)
                }
                let item = group.items.find(
                    (product) => product.__sourceItemIndex === row.itemIndex,
                )
                if (!item) {
                    item = {
                        ...row.item,
                        __sourceItemIndex: row.itemIndex,
                        qty: 0,
                        total: 0,
                    }
                    group.items.push(item)
                }
                item.qty += 1
                item.total = this.itemUnitTotal(row.item) * item.qty
            })
            return groups.map(({ groupIndex, ...group }) => ({
                ...group,
                items: group.items.map(
                    ({ __sourceItemIndex, ...item }) => item,
                ),
            }))
        },
        checkoutSplitSelection() {
            if (!this.splitSelection.length) {
                this.splitError = 'Select at least one item to checkout.'
                return
            }
            const order = this.selectedOrder
            const paidGroups = this.splitGroups(true)
            const remainingGroups = this.splitGroups(false)
            const paidSubtotal = this.splitSelectedSubtotal
            const taxRate = this.orderTaxRate(order)
            const paidTax = paidSubtotal * taxRate
            const calculatedSubtotal = this.allItems(order).reduce(
                (sum, item) => sum + this.itemLineTotal(item),
                0,
            )
            const orderSubtotal =
                Number(order.subtotal || 0) > 0
                    ? Number(order.subtotal)
                    : calculatedSubtotal
            const orderTax =
                Number(order.tax || 0) > 0
                    ? Number(order.tax)
                    : orderSubtotal * taxRate
            const remainingSubtotal = Math.max(0, orderSubtotal - paidSubtotal)
            const remainingTax = Math.max(0, orderTax - paidTax)
            const sessionId =
                order.splitSessionId ||
                order.parentOrderId ||
                order.id ||
                order.orderNumber
            const paymentNumber = Number(order.splitPaymentCount || 0) + 1
            const remainingOrder = {
                ...order,
                splitPayment: true,
                splitSessionId: sessionId,
                splitPaymentCount: paymentNumber,
                items: remainingGroups.flatMap((group) => group.items),
                orderGroups: remainingGroups,
                subtotal: remainingSubtotal,
                tax: remainingTax,
                total: remainingSubtotal + remainingTax,
                updatedAt: new Date().toISOString(),
            }
            const sourceOrderIds = (
                order.sourceOrderIds ||
                order.orders?.map((bill) => bill.id) || [order.id]
            ).filter(Boolean)
            const checkout = {
                ...order,
                splitPayment: true,
                splitSessionId: sessionId,
                splitPaymentNumber: paymentNumber,
                items: paidGroups.flatMap((group) => group.items),
                orderGroups: paidGroups,
                subtotal: paidSubtotal,
                tax: paidTax,
                total: paidSubtotal + paidTax,
                partialPayment: {
                    sourceOrderId: order.id,
                    sourceOrderIds,
                    remainingOrder,
                    splitSessionId: sessionId,
                    paymentNumber,
                },
            }
            localStorage.setItem('posfood_checkout', JSON.stringify(checkout))
            localStorage.setItem(
                'posfood_order_setup',
                JSON.stringify(order.orderSetup || {}),
            )
            this.$router.push('/pos/checkout')
        },
        isTakeaway(order) {
            return String(order.orderType || order.orderSetup?.orderType || '')
                .toLowerCase()
                .includes('take')
        },
        isSplitOrder(order) {
            return Boolean(
                order?.__splitGroup ||
                    order?.splitPayment ||
                    order?.splitSessionId ||
                    order?.splitLabel,
            )
        },
        orderLocation(order) {
            if (this.isTakeaway(order))
                return (
                    order.orderSetup?.pickupNumber ||
                    order.pickupNumber ||
                    'Pickup'
                )
            return order.orderSetup?.tableNumber || order.tableNumber || 'Table'
        },
        allItems(order) {
            if (order?.orderGroups?.length)
                return order.orderGroups.flatMap((group) => group.items || [])
            return order?.items || []
        },
        itemCount(order) {
            return this.allItems(order).reduce(
                (sum, item) => sum + (Number(item.qty) || 1),
                0,
            )
        },
        itemUnitTotal(item) {
            if (Number.isFinite(Number(item.unitTotal)))
                return Number(item.unitTotal)
            if (Number.isFinite(Number(item.unitPrice)))
                return Number(item.unitPrice)
            if (Number.isFinite(Number(item.total)) && Number(item.qty) > 0)
                return Number(item.total) / Number(item.qty)
            return (Number(item.price) || 0) + (Number(item.extra) || 0)
        },
        itemLineTotal(item) {
            if (Number.isFinite(Number(item.lineTotal)))
                return Number(item.lineTotal)
            if (Number.isFinite(Number(item.total))) return Number(item.total)
            return this.itemUnitTotal(item) * (Number(item.qty) || 1)
        },
        orderTaxRate(order) {
            const subtotal = Number(order?.subtotal || 0),
                tax = Number(order?.tax || 0)
            if (subtotal > 0 && tax >= 0) return tax / subtotal
            return Number(order?.taxRate ?? 22.5) / 100
        },
        orderTotal(order) {
            const stored = Number(order.total ?? order.payable)
            if (Number.isFinite(stored) && stored > 0) return stored
            const subtotal = this.allItems(order).reduce(
                (sum, item) => sum + this.itemLineTotal(item),
                0,
            )
            return subtotal * (1 + Number(order.taxRate ?? 22.5) / 100)
        },
        orderTime(order) {
            const date = new Date(
                order.updatedAt ||
                    order.heldAt ||
                    order.createdAt ||
                    Date.now(),
            )
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })
        },
    },
}
</script>
