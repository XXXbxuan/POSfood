<template>
    <main class="restro-page">
        <section class="restro-shell">
            <header class="restro-topbar">
                <h1>Restro POS</h1>

                <label class="search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input v-model.trim="searchKeyword" type="text" placeholder="Search products.....">
                </label>

                <div class="top-actions">
                    <button type="button" class="square-btn"><i class="fa-solid fa-rotate-right"></i></button>
                    <button type="button" class="square-btn wifi"><i class="fa-solid fa-wifi"></i></button>
                    <button type="button" class="orange-btn" @click="startTakeaway">
                        <i class="fa-solid fa-table-cells-large"></i>
                        Takeaway
                    </button>
                </div>
            </header>

            <aside class="app-sidebar">
                <button
                    v-for="item in navItems"
                    :key="item.label"
                    type="button"
                    :class="{ active: item.label === 'Tables' }"
                >
                    <i class="fa-solid" :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                </button>
                <div class="sidebar-spacer"></div>
                <div class="avatar">AT</div>
                <button type="button" @click="logout">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Logout</span>
                </button>
            </aside>

            <section class="table-workspace">
                <div class="table-tabs">
                    <button
                        v-for="tab in statusTabs"
                        :key="tab"
                        type="button"
                        :class="{ active: activeStatus === tab }"
                        @click="activeStatus = tab"
                    >
                        {{ tab }}
                    </button>
                </div>

                <div class="notice-bar">
                    <span><i class="fa-solid fa-circle-info"></i> Tables visible are for {{ selectedGuestRange }} guests occupancy.</span>
                    <button type="button" @click="activeStatus = 'All Tables'">Show all tables</button>
                </div>

                <div class="tables-grid">
                    <button
                        v-for="table in filteredTables"
                        :key="table.number"
                        type="button"
                        class="table-card"
                        :class="[table.status, table.shape, { selected: selectedTable && selectedTable.number === table.number }]"
                        @click="selectTable(table)"
                    >
                        <div class="table-art">
                            <span class="chair top one"></span>
                            <span class="chair top two"></span>
                            <span class="chair left"></span>
                            <span class="chair right"></span>
                            <span class="chair bottom one"></span>
                            <span class="chair bottom two"></span>
                            <div class="table-shape">
                                <strong>{{ table.number }}</strong>
                                <u v-if="table.orderNo">{{ table.orderNo }}</u>
                            </div>
                        </div>
                        <span class="status-strip"></span>
                    </button>
                </div>
            </section>

            <footer class="table-footer">
                <div class="legend">
                    <span><b class="occupied-dot"></b>Occupied</span>
                    <span><b class="hold-dot"></b>Order on hold</span>
                    <span><b class="vacant-dot"></b>Vacant</span>
                </div>

                <div class="guest-card">
                    <button type="button" class="close-mini">x</button>
                    <strong>Select Number of Guests</strong>
                    <div>
                        <button
                            v-for="range in guestRanges"
                            :key="range"
                            type="button"
                            :class="{ active: selectedGuestRange === range }"
                            @click="selectedGuestRange = range"
                        >
                            {{ range }}
                        </button>
                    </div>
                </div>

                <div class="selected-action">
                    <div>
                        <strong>{{ selectedTable ? 'Table ' + selectedTable.number.replace('T', 'T') : 'Table T42' }}</strong>
                        <span>Order {{ selectedTable ? (selectedTable.orderNo || '#05874') : '#05874' }}</span>
                    </div>
                    <button type="button" class="outline-action" :disabled="!selectedTable" @click="placeDineIn">
                        <i class="fa-solid fa-plus"></i>
                        Add Products
                    </button>
                    <button type="button" class="green-action" :disabled="!selectedTable" @click="placeDineIn">
                        <i class="fa-regular fa-credit-card"></i>
                        Select & Place Order
                    </button>
                </div>
            </footer>
        </section>
    </main>
</template>

<script>
export default {
    name: 'POSStart',
    data() {
        return {
            searchKeyword: '',
            activeStatus: 'All Tables',
            selectedGuestRange: '4-6',
            selectedTable: null,
            guestRanges: ['1-2', '4-6', '>6'],
            statusTabs: ['All Tables', 'Vacant', 'Occupied', 'Disabled'],
            navItems: [
                { label: 'Home', icon: 'fa-house' },
                { label: 'Customers', icon: 'fa-user' },
                { label: 'Tables', icon: 'fa-table-cells-large' },
                { label: 'Cashier', icon: 'fa-circle-dollar-to-slot' },
                { label: 'Orders', icon: 'fa-bag-shopping' },
                { label: 'Reports', icon: 'fa-chart-pie' },
                { label: 'Settings', icon: 'fa-gear' },
            ],
            tables: [
                { number: 'T43', status: 'vacant', capacity: '4-6', shape: 'square', orderNo: '' },
                { number: 'T45', status: 'hold', capacity: '4-6', shape: 'round', orderNo: '#457841' },
                { number: 'T46', status: 'vacant', capacity: '4-6', shape: 'square', orderNo: '' },
                { number: 'T47', status: 'occupied', capacity: '4-6', shape: 'square', orderNo: '#457875' },
                { number: 'T51', status: 'occupied', capacity: '4-6', shape: 'round', orderNo: '#457894' },
                { number: 'T52', status: 'vacant', capacity: '4-6', shape: 'square', orderNo: '' },
                { number: 'T21', status: 'vacant', capacity: '1-2', shape: 'round', orderNo: '' },
                { number: 'T61', status: 'disabled', capacity: '>6', shape: 'square', orderNo: '' },
            ],
        }
    },
    computed: {
        filteredTables() {
            const keyword = this.searchKeyword.toLowerCase()
            return this.tables.filter((table) => {
                const statusMatch = this.activeStatus === 'All Tables' || table.status === this.activeStatus.toLowerCase()
                const guestMatch = this.activeStatus === 'All Tables' ? table.capacity === this.selectedGuestRange : true
                const keywordMatch = !keyword || table.number.toLowerCase().includes(keyword) || table.orderNo.toLowerCase().includes(keyword)
                return statusMatch && guestMatch && keywordMatch
            })
        },
    },
    mounted() {
        if (!localStorage.getItem('posfood_active_account')) this.$router.push('/')
        this.selectedTable = this.tables.find((table) => table.number === 'T43')
    },
    methods: {
        selectTable(table) {
            if (table.status === 'disabled') return
            this.selectedTable = table
        },
        placeDineIn() {
            if (!this.selectedTable || this.selectedTable.status === 'disabled') return
            localStorage.setItem('posfood_order_setup', JSON.stringify({
                orderType: 'Dine In',
                tableNumber: this.selectedTable.number,
                pax: this.selectedGuestRange,
                orderNo: this.selectedTable.orderNo || '#05874',
            }))
            this.$router.push('/pos/order')
        },
        startTakeaway() {
            localStorage.setItem('posfood_order_setup', JSON.stringify({
                orderType: 'Takeaway',
                customerName: 'Jason',
                pickupNumber: 'T012',
                orderNo: '#05874',
            }))
            this.$router.push('/pos/order')
        },
        logout() {
            localStorage.removeItem('posfood_active_account')
            localStorage.removeItem('posfood_order_setup')
            this.$router.push('/')
        },
    },
}
</script>

<style scoped lang="scss">
$orange: #fc8019;
$green: #09aa29;
$linen: #fff2e8;
$black: #171826;
$gray: #9f9f9e;
$cultured: #f5f5f5;

.restro-page {
    min-height: 100vh;
    padding: .45rem;
    background: #efefef;
    color: $black;
    font-family: 'poppins', Arial, sans-serif;
}

.restro-shell {
    min-height: calc(100vh - .9rem);
    display: grid;
    grid-template-columns: 5.3rem 1fr;
    grid-template-rows: 4.4rem 1fr 5.6rem;
    overflow: hidden;
    border-radius: 1.35rem;
    background: $cultured;
    box-shadow: 0 .85rem 2.8rem rgba(23, 24, 38, .12);
}

.restro-topbar {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 10rem minmax(19rem, 24rem) 1fr;
    align-items: center;
    gap: 1.2rem;
    padding: 0 1rem 0 1.3rem;
    border-bottom: 1px solid #ececec;
    background: #fff;
}

.restro-topbar h1 {
    margin: 0;
    font-size: 1.65rem;
    font-weight: 900;
}

.search-box {
    height: 2.95rem;
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: 0 1rem;
    border-radius: .45rem;
    background: $cultured;
}

.search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: $black;
    font-size: .9rem;
}

.top-actions {
    display: flex;
    justify-content: flex-end;
    gap: .8rem;
}

.square-btn,
.orange-btn {
    height: 2.7rem;
    border: 0;
    border-radius: .45rem;
    font-weight: 900;
    cursor: pointer;
}

.square-btn {
    width: 2.7rem;
    background: $cultured;
    color: $black;
}

.square-btn.wifi {
    color: $green;
}

.orange-btn {
    display: flex;
    align-items: center;
    gap: .55rem;
    padding: 0 1rem;
    background: $orange;
    color: #fff;
}

.app-sidebar {
    grid-row: 2 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .58rem;
    padding: .9rem .55rem;
    border-right: 1px solid #ececec;
    background: #fff;
}

.app-sidebar button {
    width: 4rem;
    min-height: 4rem;
    border: 1px solid transparent;
    border-radius: .45rem;
    background: transparent;
    color: $gray;
    cursor: pointer;
}

.app-sidebar i,
.app-sidebar span {
    display: block;
}

.app-sidebar i {
    margin-bottom: .32rem;
    font-size: 1rem;
}

.app-sidebar span {
    font-size: .7rem;
    font-weight: 700;
}

.app-sidebar button.active {
    border-color: $orange;
    background: $linen;
    color: $orange;
}

.sidebar-spacer {
    flex: 1;
}

.avatar {
    width: 2.1rem;
    height: 2.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: $linen;
    color: $orange;
    font-size: .72rem;
    font-weight: 900;
}

.table-workspace {
    padding: .8rem 1.15rem;
    overflow: auto;
}

.table-tabs {
    max-width: 34.5rem;
    display: flex;
    gap: 1.15rem;
    align-items: center;
    padding: .55rem;
    border-radius: .45rem;
    background: #fff;
}

.table-tabs button {
    height: 2rem;
    padding: 0 .85rem;
    border: 1px solid transparent;
    border-radius: .45rem;
    background: transparent;
    color: $black;
    font-weight: 900;
    cursor: pointer;
}

.table-tabs button.active {
    border-color: $orange;
    color: $orange;
}

.notice-bar {
    max-width: 34.5rem;
    height: 2.55rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: .85rem 0 1.25rem;
    padding: 0 .9rem;
    border-radius: .45rem;
    background: #fff;
    font-weight: 900;
}

.notice-bar i,
.notice-bar button {
    color: $orange;
}

.notice-bar button {
    border: 0;
    background: transparent;
    font-weight: 900;
    cursor: pointer;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(11rem, 1fr));
    gap: 1.35rem 1.55rem;
    max-width: 56rem;
}

.table-card {
    position: relative;
    height: 11.4rem;
    padding: 1.2rem;
    overflow: hidden;
    border: 0;
    border-radius: .45rem;
    background: #fff;
    box-shadow: 0 .55rem 1.4rem rgba(23, 24, 38, .08);
    cursor: pointer;
}

.table-card.selected {
    box-shadow: 0 0 0 .18rem rgba(252, 128, 25, .28), 0 .55rem 1.4rem rgba(23, 24, 38, .08);
}

.table-art {
    position: relative;
    width: 8rem;
    height: 8rem;
    margin: 0 auto;
}

.chair {
    position: absolute;
    display: block;
    border-radius: 4rem;
    background: #dedede;
}

.chair.top,
.chair.bottom {
    width: 2.4rem;
    height: .38rem;
}

.chair.top.one { top: .1rem; left: 1.2rem; }
.chair.top.two { top: .1rem; right: 1.2rem; }
.chair.bottom.one { bottom: .1rem; left: 1.2rem; }
.chair.bottom.two { bottom: .1rem; right: 1.2rem; }
.chair.left,
.chair.right {
    width: .38rem;
    height: 2.4rem;
    top: 2.85rem;
}
.chair.left { left: .15rem; }
.chair.right { right: .15rem; }

.table-shape {
    position: absolute;
    inset: 1.35rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: .35rem;
    background: #d7d7d7;
    color: $black;
}

.round .table-shape {
    border-radius: 50%;
}

.table-shape strong {
    font-size: 1.05rem;
}

.table-shape u {
    margin-top: .15rem;
    font-weight: 900;
}

.status-strip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: .42rem;
    background: $green;
}

.hold .status-strip { background: #2d77f3; }
.occupied .status-strip { background: #ff2f1d; }
.disabled {
    opacity: .45;
    cursor: not-allowed;
}
.disabled .status-strip { background: $gray; }

.table-footer {
    grid-column: 2;
    display: grid;
    grid-template-columns: minmax(25rem, 1fr) 19rem minmax(31rem, auto);
    align-items: center;
    gap: 1.4rem;
    padding: .75rem 1.15rem;
    border-top: 1px solid #e5e5e5;
    background: #fff;
}

.legend {
    display: flex;
    gap: 2.8rem;
    align-items: center;
    font-weight: 900;
}

.legend span {
    display: flex;
    align-items: center;
    gap: .65rem;
}

.legend b {
    width: 1.95rem;
    height: 1.95rem;
    border-radius: 50%;
}

.occupied-dot { background: #ff2f1d; }
.hold-dot { background: #2d77f3; }
.vacant-dot { background: $green; }

.guest-card,
.selected-action {
    min-height: 4.55rem;
    display: flex;
    align-items: center;
    background: #fff;
    box-shadow: 0 .55rem 1.8rem rgba(23, 24, 38, .1);
}

.guest-card {
    position: relative;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: .55rem;
    padding: .75rem 1rem;
    border-radius: .65rem;
}

.close-mini {
    position: absolute;
    top: .5rem;
    right: .6rem;
    border: 0;
    background: transparent;
    color: $gray;
}

.guest-card strong {
    font-size: .85rem;
}

.guest-card div {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: .65rem;
    width: 100%;
}

.guest-card div button {
    height: 2.2rem;
    border: 1px solid transparent;
    border-radius: .25rem;
    background: $linen;
    color: $orange;
    font-size: 1.05rem;
    font-weight: 900;
}

.guest-card div button.active {
    border-color: $orange;
    background: #fff;
}

.selected-action {
    gap: .9rem;
    justify-content: space-between;
    padding: .75rem 1rem;
    border-radius: .45rem;
}

.selected-action strong,
.selected-action span {
    display: block;
}

.selected-action strong {
    font-size: 1.35rem;
}

.selected-action span {
    color: $gray;
}

.outline-action,
.green-action {
    min-width: 11.5rem;
    height: 3.1rem;
    border-radius: .42rem;
    font-size: 1rem;
    font-weight: 900;
    cursor: pointer;
}

.outline-action {
    border: 2px solid $orange;
    background: #fff;
    color: $orange;
}

.green-action {
    border: 0;
    background: $green;
    color: #fff;
}

.outline-action:disabled,
.green-action:disabled {
    opacity: .42;
    cursor: not-allowed;
}

@media (max-width: 1180px) {
    .restro-shell {
        grid-template-columns: 4.8rem 1fr;
    }

    .restro-topbar,
    .table-footer {
        grid-template-columns: 1fr;
        height: auto;
    }

    .restro-topbar {
        padding: 1rem;
    }

    .tables-grid {
        grid-template-columns: repeat(2, minmax(10rem, 1fr));
    }

    .table-footer {
        grid-column: 1 / -1;
    }
}
</style>
