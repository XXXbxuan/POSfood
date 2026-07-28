<template>
    <div class="inv-shell">
        <AppSidebar
            :active="$route.meta.nav"
            :open="menuOpen"
            @close="menuOpen = false"
            @action="handleSidebarAction"
        />
        <div class="inv-workspace">
            <AppTopbar
                :title="$route.meta.title"
                :account="store.state.activeAccount"
                :alert-count="alertCount"
                @menu="menuOpen = true"
                @notifications="toggleNotifications"
                @profile="toggleProfile"
            />
            <main class="inv-page">
                <RouterView />
            </main>
        </div>

        <ProductRegistrationModal
            v-if="registerOpen"
            @close="registerOpen = false"
        />
        <ScannerModal
            v-if="scannerOpen"
            @close="scannerOpen = false"
            @scanned="handleScan"
        />
        <SidebarActionPicker
            v-if="pickerDirection"
            :direction="pickerDirection"
            @close="pickerDirection = ''"
            @select="selectOperationProduct"
        />
        <StockOperationModal
            v-if="operation"
            :product="operationProduct"
            :direction="operation"
            @close="closeOperation"
            @completed="closeOperation"
        />

        <section v-if="notificationsOpen" class="topbar-popover notification-popover">
            <header>
                <div><span>ALERTS</span><strong>Needs attention</strong></div>
                <button class="icon-button" type="button" aria-label="Close" @click="notificationsOpen = false">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>
            <RouterLink
                v-for="product in alertProducts"
                :key="product.id"
                :to="{ path: '/inventory/scan', query: { code: product.sku } }"
                @click="notificationsOpen = false"
            >
                <i class="fa-solid" :class="product.currentStock ? 'fa-triangle-exclamation' : 'fa-circle-xmark'"></i>
                <span><strong>{{ product.name }}</strong><small>{{ product.currentStock }} {{ product.unit }} remaining</small></span>
            </RouterLink>
            <p v-if="!alertProducts.length" class="empty-popover">No active stock alerts.</p>
        </section>

        <section v-if="profileOpen" class="topbar-popover profile-popover">
            <div class="profile-summary">
                <span>{{ initials }}</span>
                <div><strong>{{ store.state.activeAccount.name }}</strong><small>{{ store.state.activeAccount.employeeId }} · {{ store.state.activeAccount.role }}</small></div>
            </div>
            <button type="button" @click="lock">
                <i class="fa-solid fa-lock"></i>Lock session
            </button>
            <button type="button" class="danger-text" @click="logout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>Sign out
            </button>
        </section>

        <button
            v-if="notificationsOpen || profileOpen"
            class="popover-scrim"
            type="button"
            aria-label="Close panel"
            @click="closePopovers"
        ></button>
    </div>
</template>

<script>
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import ProductRegistrationModal from '@/components/ProductRegistrationModal.vue'
import ScannerModal from '@/components/ScannerModal.vue'
import SidebarActionPicker from '@/components/SidebarActionPicker.vue'
import StockOperationModal from '@/components/StockOperationModal.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'InventoryLayout',
    components: {
        AppSidebar,
        AppTopbar,
        ProductRegistrationModal,
        ScannerModal,
        SidebarActionPicker,
        StockOperationModal,
    },
    data() {
        return {
            store: inventoryStore,
            menuOpen: false,
            notificationsOpen: false,
            profileOpen: false,
            registerOpen: false,
            scannerOpen: false,
            pickerDirection: '',
            operation: '',
            operationProduct: null,
        }
    },
    computed: {
        stats() {
            return this.store.dashboardStats()
        },
        alertProducts() {
            return [...this.stats.outOfStock, ...this.stats.lowStock].slice(0, 6)
        },
        alertCount() {
            return this.stats.outOfStock.length + this.stats.lowStock.length + this.stats.expiring.length
        },
        initials() {
            return this.store.state.activeAccount.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
    },
    methods: {
        toggleNotifications() {
            this.profileOpen = false
            this.notificationsOpen = !this.notificationsOpen
        },
        toggleProfile() {
            this.notificationsOpen = false
            this.profileOpen = !this.profileOpen
        },
        closePopovers() {
            this.notificationsOpen = false
            this.profileOpen = false
        },
        handleSidebarAction(action) {
            this.menuOpen = false
            this.closePopovers()
            if (action === 'register') this.registerOpen = true
            if (action === 'scan') this.scannerOpen = true
            if (action === 'in' || action === 'out') this.pickerDirection = action
        },
        handleScan(value) {
            this.scannerOpen = false
            const product = this.store.findProduct(value)
            if (!product) {
                this.store.addToast('Product code was not recognised.', 'danger')
                return
            }
            this.$router.push({ path: '/inventory/scan', query: { code: product.sku } })
        },
        selectOperationProduct(product) {
            this.operationProduct = product
            this.operation = this.pickerDirection
            this.pickerDirection = ''
        },
        closeOperation() {
            this.operation = ''
            this.operationProduct = null
        },
        lock() {
            this.store.lockSession()
            this.$router.replace({ path: '/', query: { locked: '1' } })
        },
        logout() {
            this.store.logout()
            this.$router.replace('/')
        },
    },
}
</script>
