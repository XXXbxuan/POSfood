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
                @menu="menuOpen = true"
                @scan="scannerOpen = true"
                @profile="profileOpen = !profileOpen"
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
        />

        <section v-if="profileOpen" class="topbar-popover profile-popover compact-profile-menu">
            <button type="button" @click="lock">
                <i class="fa-solid fa-lock"></i>Lock session
            </button>
            <button type="button" class="danger-text" @click="logout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>Sign out
            </button>
        </section>

        <button
            v-if="profileOpen"
            class="popover-scrim"
            type="button"
            aria-label="Close account menu"
            @click="profileOpen = false"
        ></button>
    </div>
</template>

<script>
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import ProductRegistrationModal from '@/components/ProductRegistrationModal.vue'
import ScannerModal from '@/components/ScannerModal.vue'
import SidebarActionPicker from '@/components/SidebarActionPicker.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'InventoryLayout',
    components: {
        AppSidebar,
        AppTopbar,
        ProductRegistrationModal,
        ScannerModal,
        SidebarActionPicker,
    },
    data() {
        return {
            store: inventoryStore,
            menuOpen: false,
            profileOpen: false,
            registerOpen: false,
            scannerOpen: false,
            pickerDirection: '',
        }
    },
    methods: {
        handleSidebarAction(action) {
            this.menuOpen = false
            this.profileOpen = false
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
